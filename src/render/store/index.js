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
      canAddr: [],
      fileList:[],
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
      state.udsProject.canAddr.push(item);
    },
    canAddrDelete(state, index) {
      state.canAddrTable.splice(index, 1);
      state.udsProject.canAddr.splice(index, 1);
    },
    canAddrLoad(state, data) {
      Vue.set(state,"canAddrTable",data);
      Vue.set(state.udsProject,"canAddr",data);
    },
    /*can table*/
    canTableLoad(state, data) {
      Vue.set(state,"canTable",data);
      Vue.set(state.udsProject,"can",data);
    },
  },
  actions: {

  }
})
