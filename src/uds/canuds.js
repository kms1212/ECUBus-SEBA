/* eslint-disable no-undef */
/* eslint-disable no-empty */
const path = require('path')
const sprintf = require('sprintf-js').sprintf
const { ipcMain } = require('electron')
const UDS = require('./uds.js')
const ErrorText = {
  0: 'OK!',
  1: 'Timeout occured between 2 frames transmission',
  2: 'Sender side timeout while waiting for flow control frame.',
  3: 'Receiver side timeout while waiting for consecutive frame.',
  4: 'Unexpected sequence number',
  5: 'Invalid or unknown FlowStatus',
  6: 'Unexpected protocol data unit'
}


const PCANTP = require('./../../build/Release/PCANTP.node')
// const  PCANTP = require(path.join(__static, 'PCANTP.node'))
const isDevelopment = process.env.NODE_ENV !== 'production'
const dllPath = isDevelopment ? path.join(__static, 'peak') : path.join(process.resourcesPath, 'peak')
class CANUDS extends UDS {
  constructor(win) {
    super(win)
    this.cantp = new PCANTP.CANTP(dllPath)
    this.canfd = false
    this.channel = PCANTP.PCANTP_USBBUS1
    this.udsTimer = setTimeout(() => { }, 0)
    this.receive = false
    clearTimeout(this.udsTimer)
    ipcMain.on('canConnect', (event, arg) => {
      var err = this.cantp.Initialize(arg[0], arg[1])
      this.canfd = false
      this.channel = arg[0]
      var padding = arg[2]
      var buf = new Uint8Array(1);
      /* set padding */
      if (padding)
        buf[0] = PCANTP.PCANTP_CAN_DATA_PADDING_ON
      else
        buf[0] = PCANTP.PCANTP_CAN_DATA_PADDING_NONE
      if (err == 0) {
        err = this.cantp.SetValue(arg[0], PCANTP.PCANTP_PARAM_CAN_DATA_PADDING, buf.buffer)
      }
      event.returnValue = {
        err: err,
        msg: this.cantp.GetErrorText(err)
      }
    })
    ipcMain.on('canConnectFd', (event, arg) => {
      var err = this.cantp.InitializeFd(arg[0], arg[1])
      this.canfd = true
      this.channel = arg[0]
      var padding = arg[2]
      var tlc = arg[3]
      var buf = new Uint8Array(1);
      /* set padding */
      if (padding)
        buf[0] = PCANTP.PCANTP_CAN_DATA_PADDING_ON
      else
        buf[0] = PCANTP.PCANTP_CAN_DATA_PADDING_NONE
      if (err == 0) {
        err = this.cantp.SetValue(arg[0], PCANTP.PCANTP_PARAM_CAN_DATA_PADDING, buf.buffer)
      }
      /* set tlc*/
      buf[0] = tlc
      if (err == 0) {
        err = this.cantp.SetValue(arg[0], PCANTP.PCANTP_PARAM_CAN_TX_DL, buf.buffer)
      }
      event.returnValue = {
        err: err,
        msg: this.cantp.GetErrorText(err)
      }

    })
    ipcMain.on('canDisconnect', (event, arg) => {
      var err = this.cantp.Uninitialize(arg)
      event.returnValue = {
        err: err,
        msg: this.cantp.GetErrorText(err)
      }
    })
    ipcMain.on('canAddMap', (event, arg) => {
      var ret = {}
      ret.err = this.cantp.AddMapping(this.channel, arg.txId, arg.rxId, arg.IDTYPE, arg.FORMAT, arg.MSGTYPE, arg.SA, arg.TA, arg.TA_TYPE, arg.RA)
      if (ret.err === 0) {
        ret.err = this.cantp.AddMapping(this.channel, arg.rxId, arg.txId, arg.IDTYPE, arg.FORMAT, arg.MSGTYPE, arg.TA, arg.SA, arg.TA_TYPE, arg.RA)
        ret.msg = this.cantp.GetErrorText(ret.err)
      } else {
        ret.msg = this.cantp.GetErrorText(ret.err)
      }
      event.returnValue = ret
    })
    ipcMain.on('canDeleteMap', (event, arg) => {
      var ret = {}
      ret.err = this.cantp.RemoveMapping(this.channel, arg[0])
      if (ret.err === 0) {
        ret.err = this.cantp.RemoveMapping(this.channel, arg[1])
        ret.msg = this.cantp.GetErrorText(ret.err)
      } else {
        ret.msg = this.cantp.GetErrorText(ret.err)
      }
      event.returnValue = ret
    })
    ipcMain.on('canudsExcute', (event, arg) => {
      this.UDSstart(arg.udsTable)
      this.timeout = arg.timeout
      this.sDelay = arg.sDelay
      this.addr = arg.addr
      this.step()
    })
  }

  delay(timeout) {
    var t = typeof timeout !== 'undefined' ? timeout : this.timeout
    this.udsTimer = setTimeout(() => {
      this.emit('udsError', {
        msg: 'No Response',
        index: this.tableIndex
      })
    }, t)
  }
  Unload() {
    this.cantp.Unload()
  }
  eventHandle() {
    var err
    var msg = {}
    err = this.cantp.TpRead(this.channel, msg)
    if (err === 0) {
      switch (msg.MSGTYPE) {
        case PCANTP.PCANTP_MESSAGE_REQUEST_CONFIRMATION:
          if (msg.RESULT === 0) {

            if (this.suppress) {
              /* suppress, don't wait response */
              setTimeout(() => {
                this.step()
              }, this.sDelay)
            } else {
              this.udsTimer = setTimeout(() => {
                this.emit('udsError', {
                  msg: 'No response',
                  index: this.tableIndex
                })
              }, this.timeout)
            }
          } else {
            this.emit('udsError', {
              msg: sprintf('[error]:Write from 0x%x to 0x%x with RA 0x%x,result:%s', msg.SA.toString(16), msg.TA.toString(16), msg.RA.toString(16),
                ErrorText[msg.RESULT]),
              index: this.tableIndex
            })
          }
          break

        // case PCANTP.PCANTP_MESSAGE_INDICATION_TX:
        //   // ret.msg += '(' + this.index + ') Tx Message pending from 0x' + msg.SA.toString(16) + ' to 0x' + msg.TA.toString(16) + ' with RA 0x' + msg.RA.toString(16) +
        //   //   ' LEN:' + msg.LEN + ' - result:' + ErrorText[msg.RESULT] + '\r\n'
        //   break
        // case PCANTP.PCANTP_MESSAGE_INDICATION:
        //   // ret.msg += '(' + this.index + ') Rx Message pending from 0x' + msg.SA.toString(16) + ' to 0x' + msg.TA.toString(16) + ' with RA 0x' + msg.RA.toString(16) +
        //   //   ' LEN:' + msg.LEN + ' - result:' + ErrorText[msg.RESULT] + '\r\n'
        //   break
        case PCANTP.PCANTP_MESSAGE_DIAGNOSTIC:
        case PCANTP.PCANTP_MESSAGE_REMOTE_DIAGNOSTIC:
          if (this.receive) {
            this.receive = false;
            clearTimeout(this.udsTimer)
            // this.emit('udsData', sprintf("[data]:msg:%s.\r\n", msg.DATA.join(',')))
            try {
              if ((msg.DATA[0] == 0x7F) && (msg.DATA[2] == 0x78)) {
                this.receive = true;
                this.delay()
                break
              }
              if (this.checkFunc(this.writeData, msg.DATA)) {
                //if (this.udsTimer.hasRef()) {
                //  this.receive = true;
                //  this.info('User insert a new delay')
                //} else {
                  this.step()
                //}
              } else {
                this.emit('udsError', {
                  msg: 'User defined function return false',
                  index: this.tableIndex
                })
              }
            } catch (error) {
              this.emit('udsError', {
                msg: sprintf("User defined function syntax error,%s", error.message),
                index: this.tableIndex
              })
            }
          }
          break
      }
    } else {
      this.emit('udsError', {
        msg: sprintf("%s", this.cantp.GetErrorText(ret.err)),
        index: this.tableIndex
      })
    }
  }
  registerCallback(fn) {
    this.cantp.RegCb(fn)
  }
  step() {
    try {
      var item = this.getNextService()
    } catch (e) {
      this.emit('udsError', {
        msg: "User defined function syntax error," + e.message,
        index: this.tableIndex
      })
      return -1
    }
    if (item === null) {
      this.emit('udsEnd', "Excute successful")
      return 0
    }
    this.checkFunc = item.checkFunc
    this.writeData = item.payload
    var msg = this.addr
    this.suppress = item.suppress
    if (this.canfd) {
      msg.IDTYPE |= PCANTP.PCANTP_ID_CAN_FD
      msg.IDTYPE |= PCANTP.PCANTP_ID_CAN_BRS
    }

    msg.DATA = item.data
    msg.LEN = item.data.length
    var err = this.cantp.TpWrite(this.channel, msg)
    if (err !== 0) {
      this.emit('udsError',
        {
          msg: sprintf('%s', this.cantp.GetErrorText(err)),
          index: this.tableIndex
        })
    } else {
      this.receive = !this.suppress
    }
  }
}

module.exports = CANUDS;
