import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    canConnect: false,
    logLevel:'info',
    /*addr*/
    canAddrTable: [],
    tableErrorIndex:[-1,-1],
    /* service */ 
    canTable: [],
    running: false,
    udsProject:{
      name:'',
      can:[],
      canAddr:[],
      fileList:[],
      canDevSettings:{
        canfd: false,
        device: 0x51,
        fdNomSpeed: "f_clock=80000000,nom_brp=10,nom_tseg1=12,nom_tseg2=3,nom_sjw=1,",
        fdDataSpeed: "data_brp=4,data_tseg1=7,data_tseg2=2,data_sjw=1",
        speed: 0x001C,
        padding: false,
        fdTlc: 8
      },
      version:''
    },
    udsProjectPath:''
  },
  mutations: {
    addSch(state,mode){
      state[mode+'Table'].push({
        name:'sch'+(state[mode+'Table'].length+1),
        addr:'',
        services:[]
      })
    },
    setUdsProject(state,mode){
      Vue.set(state.udsProject,mode.key,mode.val);
    },
    setUdsProjectPath(state,mode){
      state.udsProjectPath=mode
    },
    logLevel(state,level){
      state.logLevel=level
    },
    setTableError(state,index){
      state.tableErrorIndex=index
    },
    runChange(state, run) {
      state.running = run
    },
    /* connect*/
    canChange(state, connect) {
      state.canConnect = connect
    },
    /* can addr table */
    canAddrAdd(state, item) {
      state.canAddrTable.push(item);
    },
    canAddrDelete(state, index) {
      state.canAddrTable.splice(index, 1);
    },
    canAddrLoad(state, data) {
      Vue.set(state,"canAddrTable",data);
    },
    /* can addr config table */
    canAddrCfgAdd(state, item) {
      state.udsProject.canAddr.push(item);
    },
    canAddrCfgDelete(state, index) {
      state.udsProject.canAddr.splice(index, 1);
    },
    canAddrCfgLoad(state, data) {
      Vue.set(state.udsProject,"canAddr",data);
    },
    /*can table*/
    canTableLoad(state, data) {
      Vue.set(state,"canTable",data);
      Vue.set(state.udsProject,"can",data);
    },
    /* can device settings */
    canDevSettingsLoad(state, data) {
      Vue.set(state.udsProject, "canDevSettings", data);
    }
  },
  actions: {

  }
})
