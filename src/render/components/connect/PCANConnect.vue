<template>
  <div class="connect">
    <el-row style="margin:0px">
      <el-col :span="11">
        <div class="title">Device:</div>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="8">
        <el-select v-model="device" placeholder="Deivce" :disabled="connected">
          <el-option
            v-for="item in deviceList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-col>
      <el-col :span="8" :offset="1">
        <el-checkbox v-model="padding" border :disabled="connected">PADDING</el-checkbox>
      </el-col>
      <el-col :span="6" :offset="1">
        <el-checkbox v-model="canfd" border :disabled="connected">CAN-FD</el-checkbox>
      </el-col>
    </el-row>
    <div v-if="!canfd">
      <el-row style="margin:0px">
        <el-col :span="11">
          <div class="title">Nominal Bit rate:</div>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="11">
          <el-select v-model="speed" placeholder="Speed" :disabled="connected">
            <el-option
              v-for="item in speedSel"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-col>
      </el-row>
    </div>
    <div v-else>
      <el-row style="margin:0px">
        <el-col :span="8">
          <div class="title">Nominal Bit rate:</div>
        </el-col>
        <el-col :span="8" :offset="1">
          <div class="title">Data Bit rate:</div>
        </el-col>
        <el-col :span="6" :offset="1">
          <div class="title">TLC:</div>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-select v-model="nomSpeed" placeholder="Nominal Speed" :disabled="connected">
            <el-option
              v-for="item in nomSpeedSel"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="8" :offset="1">
          <el-select v-model="dataSpeed" placeholder="Data Speed" :disabled="connected">
            <el-option
              v-for="item in dataSpeedSel"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="6" :offset="1">
          <el-select v-model="tlc" placeholder="TLC" :disabled="connected">
            <el-option
              v-for="item in fdTLC"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-col>
      </el-row>
    </div>
    <el-row style="text-align:right">
      <el-col :span="4" :offset="20" v-if="!connected">
        <el-button type="primary" plain @click="connect">Connect</el-button>
      </el-col>
      <el-col :span="4" :offset="20" v-else>
        <el-button type="danger" plain @click="disconnect">Disconnect</el-button>
      </el-col>
    </el-row>
    <el-divider v-show="connected"></el-divider>
    <div v-show="connected">
      <el-form :model="tpConfig" :disabled="!connected">
        <el-form-item label="Name:">
          <el-input v-model="tpConfig.name" placeholder="Name" maxlength="20" style="width:180px"></el-input>
        </el-form-item>
        <el-form-item label="Format:">
          <el-select v-model="tpConfig.FORMAT" placeholder="Address Format">
            <el-option
              v-for="item in formatList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Address:">
          <el-radio-group v-model="tpConfig.TA_TYPE">
            <el-radio-button :label="1">Physical</el-radio-button>
            <el-radio-button :label="2">Functional</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Message:">
          <el-radio-group v-model="tpConfig.MSGTYPE">
            <el-radio-button :label="1">Local</el-radio-button>
            <el-radio-button :label="2">Remote</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="CAN ID:">
          <el-radio-group v-model="tpConfig.IDTYPE" :disabled="bit29Must">
            <el-radio-button :label="1">11 Bits</el-radio-button>
            <el-radio-button :label="2">29 Bits</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item required>
          <el-col :span="7">
            <div>SA:</div>
            <el-input
              style="width:120px"
              v-model="tpConfig.SA"
              placeholder="SA"
              maxlength="2"
              show-word-limit
            >
              <template slot="prepend">0x</template>
            </el-input>
          </el-col>
          <el-col :span="7" :offset="1">
            <div>TA:</div>
            <el-input
              style="width:120px"
              v-model="tpConfig.TA"
              placeholder="TA"
              maxlength="2"
              show-word-limit
            >
              <template slot="prepend">0x</template>
            </el-input>
          </el-col>
          <el-col :span="7" :offset="1">
            <div>RA:</div>
            <el-input
              style="width:120px"
              v-model="tpConfig.RA"
              placeholder="RA"
              maxlength="2"
              show-word-limit
            >
              <template slot="prepend">0x</template>
            </el-input>
          </el-col>
        </el-form-item>
        <el-alert v-if="mapMust" title="The map between IP and ID is necessary." type="info" effect="dark" :closable="false"></el-alert>
        <!-- <div v-else>
                    <div>TX-CANID: <span class="header">0x{{txId}}</span></div>
                    <div>RX-CANID: <span class="header">0x{{rxId}}</span></div>
        </div>-->
        <el-form-item v-if="mapMust" required>
          <el-col :span="8">
            MAP TX_ID:
            <el-input v-model="tpConfig.txId" placeholder="CAN TX ID" maxlength="8" show-word-limit>
              <template slot="prepend">0x</template>
            </el-input>
          </el-col>
          <el-col :span="8" :offset="1">
            MAP RX_ID:
            <el-input v-model="tpConfig.rxId" placeholder="CAN RX ID" maxlength="8" show-word-limit>
              <template slot="prepend">0x</template>
            </el-input>
          </el-col>
        </el-form-item>
        <el-form-item style="text-align:right">
          <el-button @click="setupAddr" type="primary" plain>ADD</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-table size="mini" :data="addrTable" style="width: 100%" empty-text="No Data" v-show="connected">
      <el-table-column type="index" width="50" align="center"></el-table-column>
      <el-table-column prop="name" label="Name" width="100" align="center"></el-table-column>
      <el-table-column prop="txId" label="Send ID" width="250" align="center">
        <template slot-scope="scope">
          <el-tag size="medium" type="info">{{scope.row.txId}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rxId" label="Receive ID" width="250" align="center">
        <template slot-scope="scope">
          <el-tag size="medium" type="info">{{scope.row.rxId}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="maped" label="Maped" width="70" align="center">
        <template slot-scope="scope">
          <i class="el-icon-circle-check" v-if="scope.row.maped" style="color:green"></i>
          <i class="el-icon-circle-close" v-else style="color:red"></i>
        </template>
      </el-table-column>
      <el-table-column prop="SA" label="SA" width="100" align="center">
        <template slot-scope="scope">
          <el-tag size="medium" type="info">0X{{scope.row.SA.toString(16)}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="TA" label="TA" width="100" align="center">
        <template slot-scope="scope">
          <el-tag size="medium" type="info">0X{{scope.row.TA.toString(16)}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="TA_TYPE" label="TA Type" align="center" width="150">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.TA_TYPE==1" size="medium">Physical</el-tag>
          <el-tag v-else size="medium" type="success">Functional</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="RA" label="RA" width="100" align="center">
        <template slot-scope="scope">
          <el-tag size="medium" type="info">0X{{scope.row.RA.toString(16)}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="FORMAT" label="Format" width="200" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.FORMAT==1" type="warning" size="medium">Normal addressing</el-tag>
          <el-tag
            v-else-if="scope.row.FORMAT==2"
            size="medium"
            type="warning"
          >Normal fixed addressing</el-tag>
          <el-tag v-else-if="scope.row.FORMAT==3" size="medium" type="warning">Extended addressing</el-tag>
          <el-tag v-else-if="scope.row.FORMAT==4" size="medium" type="warning">Mixed addressing</el-tag>
          <el-tag v-else size="medium" type="warning">Enhanced addressing</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="IDTYPE" label="ID Length" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.IDTYPE==1" size="medium">11 Bits</el-tag>
          <el-tag v-else size="medium" type="success">29 Bits</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="MSGTYPE" label="Frame" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.MSGTYPE==1" size="medium">Local</el-tag>
          <el-tag v-else size="medium" type="success">Remote</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Action" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="danger"
            :disabled="!connected"
            @click="handleDelete(scope.$index)"
          >Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
//import PCANTP from './../../build/Release/PCANTP.node'

const { ipcRenderer } = require("electron");
export default {
  mounted() {
    this.speed = this.$store.state.udsProject.canDevSettings.speed;
    this.nomSpeed = this.$store.state.udsProject.canDevSettings.fdNomSpeed;
    this.dataSpeed = this.$store.state.udsProject.canDevSettings.fdDataSpeed;
  },
  data: function() {
    return {
      tpConfig: {
        name: "defaultName1",
        SA: "0",
        TA: "0",
        RA: "0",
        txId: "0",
        rxId: "0",
        MSGTYPE: 1,
        FORMAT: 1,
        IDTYPE: 1,
        TA_TYPE: 1,
      },
      tlc:this.$store.state.udsProject.canDevSettings.fdTlc,
      padding:this.$store.state.udsProject.canDevSettings.padding,
      formatList: [
        {
          label: "Normal addressing",
          value: 1
        },
        {
          label: "Normal fixed addressing",
          value: 2
        },
        {
          label: "Extended addressing",
          value: 3
        },
        {
          label: "Mixed addressing",
          value: 4
        }
        // {
        //   label: 'Enhance addressing',
        //   value: PCANTP.PCANTP_FORMAT_ENHANCED
        // }
      ],
      canfd: this.$store.state.udsProject.canDevSettings.canfd,
      device: this.$store.state.udsProject.canDevSettings.device,
      deviceList: [
        {
          label: "PEAK-USB1",
          value: 0x51
        },
        {
          label: "PEAK-USB2",
          value: 0x52
        }
      ],
      speed: null,
      fdTLC:[
        {
          label:'8',
          value:8,
        },
        {
          label:'12',
          value:9
        },
        {
          label:'16',
          value:10
        },
        {
          label:'20',
          value:11
        },
        {
          label:'24',
          value:12
        },
        {
          label:'32',
          value:13
        },
        {
          label:'48',
          value:14
        },
        {
          label:'64',
          value:15
        },
      ],
      nomSpeed: null,
      dataSpeed: null,
      speedSel: [
        {
          label: "250 KBit/s",
          value: "SPD_250Kbps"
        },
        {
          label: "500 KBit/s",
          value: "SPD_500Kbps"
        },
        {
          label: "1 MBit/s",
          value: "SPD_1Mbps"
        }
      ],
      nomSpeedSel: [
        {
          label: "500 KBit/s",
          value: "SPD_500Kbps"
        },
        {
          label: "1 MBit/s",
          value: "SPD_1Mbps"
        }
      ],
      dataSpeedSel: [
        {
          label: "500 KBit/s",
          value: "SPD_500Kbps"
        },
        {
          label: "1 MBit/s",
          value: "SPD_1Mbps"
        },
        {
          label: "2 MBit/s",
          value: "SPD_2Mbps"
        },
        {
          label: "4 MBit/s",
          value: "SPD_4Mbps"
        },
      ],
      speedValue: {
        SPD_250kbps: 0x011C,
        SPD_500kbps: 0x001C,
        SPD_1Mbps: 0x0014,
      },
      nomSpeedValue: {
        SPD_500kbps:
          "f_clock=80000000,nom_brp=10,nom_tseg1=12,nom_tseg2=3,nom_sjw=1,",
        SPD_1Mbps: 
          "f_clock=80000000,nom_brp=10,nom_tseg1=5,nom_tseg2=2,nom_sjw=1,",
      },
      dataSpeedValue: {
        SPD_500kbps:
          "data_brp=16,data_tseg1=7,data_tseg2=2,data_sjw=1",
        SPD_1Mbps: 
          "data_brp=8,data_tseg1=7,data_tseg2=2,data_sjw=1",
        SPD_2Mbps: 
          "data_brp=4,data_tseg1=7,data_tseg2=2,data_sjw=1",
        SPD_4Mbps: 
          "data_brp=2,data_tseg1=7,data_tseg2=2,data_sjw=1",
      },
    };
  },
  computed: {
    addrTable: function() {
      return this.$store.state.canAddrTable;
    },
    addrConfig: function() {
      return this.$store.state.udsProject.canAddr;
    },
    canDevSettings: function() {
      return this.$store.state.canDevSettings;
    },
    connected: function() {
      return this.$store.state.canConnect;
    },
    txId: function() {
      let ta = parseInt(this.tpConfig.TA, 16) << 8;
      let sa = parseInt(this.tpConfig.SA, 16);
      if (this.tpConfig.FORMAT === 2) {
        return (0x18da0000 + ta + sa).toString(16)+'(MF)'+(0x18db0000 + ta + sa).toString(16)+'(SF)';
      } else {
        return (0x18ce0000 + ta + sa).toString(16)+'(MF)'+(0x18cd0000 + ta + sa).toString(16)+'(SF)';
      }
    },
    rxId: function() {
      let ta = parseInt(this.tpConfig.SA, 16) << 8;
      let sa = parseInt(this.tpConfig.TA, 16);
       if (this.tpConfig.FORMAT === 2) {
        return (0x18da0000 + ta + sa).toString(16)+'(MF)'+(0x18db0000 + ta + sa).toString(16)+'(SF)';
      } else {
        return (0x18ce0000 + ta + sa).toString(16)+'(MF)'+(0x18cd0000 + ta + sa).toString(16)+'(SF)';
      }
    },
    bit29Must: function() {
      if (this.tpConfig.FORMAT === 2) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.tpConfig.IDTYPE = 2;
        return true;
      } else {
        return false;
      }
    },
    mapMust: function() {
      if (this.tpConfig.FORMAT === 2) {
        return false;
      }
      if (this.tpConfig.FORMAT === 4 && this.tpConfig.IDTYPE === 2) {
        return false;
      }
      return true;
    }
  },
  methods: {
    handleDelete(index) {
      if (this.addrTable[index].maped) {
        let err = ipcRenderer.sendSync("canDeleteMap", [
          this.addrTable[index].txId,
          this.addrTable[index].rxId
        ]);
        if (err.err !== 0) {
          this.$notify.error({
            title: "Error",
            message: err.msg
          });
          return;
        }
      }
      this.$store.commit("canAddrDelete", index);
    },
    registerAddr(tpconfig, mapMust) {
      for (var i in this.addrTable) {
        if (this.addrTable[i].name === tpconfig.name) {
          this.$notify.error({
            title: "Error",
            message: "Name Exist"
          });
          return;
        }
      }
      if (tpconfig.SA === tpconfig.TA) {
        this.$notify.error({
          title: "Error",
          message: "SA Equal TA"
        });
        return;
      }
      if ((tpconfig.txId === tpconfig.rxId) && (mapMust)) {
        this.$notify.error({
          title: "Error",
          message: "TX_ID Equal RX_ID"
        });
        return;
      }

      let tpconfig_rawval = tpconfig;

      tpconfig.maped = mapMust;
      tpconfig.SA = parseInt(tpconfig.SA, 16);
      tpconfig.TA = parseInt(tpconfig.TA, 16);
      tpconfig.RA = parseInt(tpconfig.RA, 16);

      if (mapMust === false) {
        tpconfig.rxId = this.rxId;
        tpconfig.txId = this.txId;
      } else {
        tpconfig.rxId = parseInt(tpconfig.rxId, 16);
        tpconfig.txId = parseInt(tpconfig.txId, 16);
        let err = ipcRenderer.sendSync("canAddMap", tpconfig);
        if (err.err !== 0) {
          this.$notify.error({
            title: "Error",
            message: err.msg
          });
          return;
        }
      }
      this.$store.commit("canAddrAdd", tpconfig);
      this.$store.commit("canAddrCfgAdd", tpconfig_rawval);
    },
    setupAddr() {
      var tpconfig = JSON.parse(JSON.stringify(this.tpConfig));
      this.registerAddr(tpconfig, this.mapMust);
    },
    importAddr() {
      for (var i in this.addrConfig) {
        let addrConfig = this.addrConfig[i];
        addrConfig.SA = addrConfig.SA.toString(16);
        addrConfig.TA = addrConfig.TA.toString(16);
        addrConfig.RA = addrConfig.RA.toString(16);
        addrConfig.rxId = addrConfig.rxId.toString(16);
        addrConfig.txId = addrConfig.txId.toString(16);
        this.registerAddr(this.addrConfig[i], this.addrConfig[i].maped);
      }
    },
    connect() {
      let err;
      if (this.canfd) {
        let nomSpeed = this.nomSpeedValue[this.nomSpeed];
        let dataSpeed = this.dataSpeedValue[this.dataSpeed];
        
        err = ipcRenderer.sendSync("canConnectFd", [
          this.device,
          nomSpeed + dataSpeed,
          this.padding,
          this.tlc
        ]);
      } else {
        let speed = this.speedValue[this.speed];
        err = ipcRenderer.sendSync("canConnect", [this.device, speed, this.padding]);
      }

      this.$store.commit("canDevSettingsLoad", {
        canfd: this.canfd,
        device: this.device,
        fdNomSpeed: this.nomSpeed,
        fdDataSpeed: this.dataSpeed,
        speed: this.speed,
        padding: this.padding,
        fdTlc: this.tlc
      });

      if (err.err === 0) {
        // this.connected = true
        this.$store.commit("canChange", true);
      } else {
        this.$notify.error({
          title: "Error",
          message: err.msg
        });
      }

      this.importAddr();
    },
    disconnect() {
      for (let i = 0; i < this.addrTable.length; i++) {
        this.handleDelete(0);
      }
      let err = ipcRenderer.sendSync("canDisconnect", this.device);
      if (err.err === 0) {
        this.$store.commit("canChange", false);
      } else {
        this.$notify.error({
          title: "Error",
          message: err.msg
        });
      }
    }
  },
};
</script>
<style>
.el-row {
  margin-bottom: 10px;
}
.header {
  font-weight: 800;
}
.title {
  line-height: 18px;
  font-weight: 550;
}
</style>
