<template>
  <div class="home">
    <div class="title1">
      <img src="./../assets/logo.png" />
      <span>ECUBus</span>
    </div>
    <div>
      <el-dialog title="Create Project" :visible.sync="create" width="30%">
        <!-- <span>这是一段信息</span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="dialogVisible = false"
            >确 定</el-button
          >
        </span> -->
        <el-form :model="createProInfo" label-width="80px" ref="createForm">
          <el-form-item label="Name" required prop="name">
            <el-input v-model="createProInfo.name"></el-input>
          </el-form-item>
          <el-form-item label="Path" required prop="path">
            <el-input v-model="createProInfo.path" disabled>
              <el-button
                slot="append"
                icon="el-icon-folder"
                @click="choseFolder('create')"
              ></el-button>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="realCreatePro">Create</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>
      <el-divider />
      <div style="text-align: center; margin: 50px" v-if="project.name == ''">
        <el-button type="primary" @click="createProject"
          >Create UDS Project</el-button
        >
        <el-button type="success" @click="openProject"
          >Open UDS Project</el-button
        >
        <div class="tips_create">
          <el-alert
            show-icon
            title="Please create or open a project firstly"
            :closable="false"
            type="info"
          >
          </el-alert>
        </div>
      </div>
      <div v-else>
        <udsProject />
      </div>
      <el-divider />
      <div class="card">
        <el-row>
          <el-col :span="6" :offset="1">
            <el-card shadow="always">
              <div class="name">DoCAN ISO-15765-2</div>
              <div class="tip">UDS Over CAN/CAN-FD</div>
              <el-button
                @click="goPEAK"
                type="text"
                :disabled="project.name == ''"
                >GO</el-button
              >
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>
<script>
const { remote } = require("electron");
// eslint-disable-next-line no-unused-vars
const { dialog } = remote;
const fs = remote.require("fs");
const path = remote.require("path");
import topPack from "./../../../package.json";
import udsProject from "./../components/udsProject.vue";
const { ipcRenderer } = require("electron");
export default {
  data: function () {
    return {
      height: 0,
      width: 0,
      create: false,
      createProInfo: {
        name: "",
        path: "",
      },
    };
  },
  components: {
    udsProject,
  },
  computed: {
    project: function () {
      return this.$store.state.udsProject;
    },
    projectPath: function () {
      return this.$store.state.udsProjectPath;
    },
  },
  mounted() {
    this.height = window.innerHeight;
    this.width = window.innerWidth;
    window.addEventListener("resize", this.resizeHandle);
  },
  destroyed() {
    window.removeEventListener("resize", this.resizeHandle);
  },
  methods: {
    createProject() {
      this.create = true;
    },
    openProject() {
      let val = dialog.showOpenDialogSync({
        title: "Open Project",
        properties: ["openDirectory"],
      });
      if (val != undefined) {
        try {
          let config = JSON.parse(
            fs.readFileSync(path.join(val[0], "config.json"))
          );
          if (config.version != topPack.version) {
            this.$notify.error({
              title: "error",
              message: `This project file is not compatible with this version of ECUBus. Please migrate the project file.`,
            });
            return;
          }

          this.$store.commit("setUdsProject", {
            key: "name",
            val: config.name,
          });
          this.$store.commit("canTableLoad", config.can);
          this.$store.commit("setUdsProject", {
            key: "fileList",
            val: config.fileList,
          });
          this.$store.commit("setUdsProject", {
            key: "version",
            val: config.version,
          });
          this.$store.commit("canAddrLoad", []);
          this.$store.commit("canAddrCfgLoad", config.canAddr);
          this.$store.commit("canDevSettingsLoad", config.canDevSettings);
          this.$store.commit("setUdsProjectPath", val[0]);
          ipcRenderer.send("udsProjectPath", val[0]);
        } catch {
          this.$notify.error({
            title: "error",
            message: `Open Project Error`,
          });
        }
      }
    },
    realCreatePro() {
      this.$refs.createForm.validate((valid) => {
        if (valid) {
          let proPath = path.join(
            this.createProInfo.path,
            this.createProInfo.name
          );
          if (fs.existsSync(proPath)) {
            this.$notify.error({
              title: "error",
              message: `Project ${this.createProInfo.name} has exist`,
            });
            return;
          } else {
            fs.mkdirSync(proPath);
            let configFile = path.join(proPath, "config.json");
            ipcRenderer.send("udsProjectPath", proPath);
            this.$store.commit("setUdsProject", {
              key: "name",
              val: this.createProInfo.name,
            });
            this.$store.commit("setUdsProjectPath", proPath);
            this.$store.commit("setUdsProject", {
              key: "version",
              val: topPack.version,
            });
            this.$store.commit("canTableLoad", []);
            this.$store.commit("canAddrLoad", []);
            this.$store.commit("canAddrCfgLoad", []);
            this.$store.commit("setUdsProject", {
              key: "fileList",
              val: [],
            });
            fs.writeFileSync(configFile, JSON.stringify(this.project));
            this.create = false;
          }
        } else {
          return false;
        }
      });
    },
    choseFolder(c) {
      if (c == "create") {
        let val = dialog.showOpenDialogSync({
          title: "Create Project",
          properties: ["openDirectory"],
        });
        if (val != undefined) {
          this.createProInfo.path = val[0];
        }
      }
    },
    goPEAK() {
      this.$router.push("/uds/pcan");
    },
    goBack() {
      this.$router.push("/");
    },
    goPage(url) {
      this.$router.push(url);
    },
    resizeHandle() {
      this.height = window.innerHeight;
    },
  },
};
</script>
<style>
.tips_create {
  position: absolute;
  top: 120px;
  right: 30px;
}
.home {
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
}
.catalog {
  font-size: 20px;
  margin: 20px;
  color: gray;
}
.title1 {
  height: 24px;
  line-height: 32px;
  margin: 10px;
}
.title1 span {
  position: absolute;
  margin-left: 5px;
  font-size: 24px;
  font-weight: bold;
}
.title1 img {
  height: 32px;
  margin-right: 10px;
}
.doip {
  background-color: white;
  height: 98%;
  border-radius: 10px;
  border-style: solid;
}
.doip .name {
  color: black;
  font-size: 36px;
  text-align: center;
  margin: 10px;
}
.doip .button {
  position: absolute;
  color: black;
  font-size: 25px;
  margin: 10px;
  right: 0px;
  bottom: 0px;
}
.doip img {
  margin: 5px;
  width: 100px;
}
.peak {
  background-color: black;
  height: 100%;
  border-radius: 10px;
}
.peak img {
  margin-left: 10px;
  margin-top: 5px;
}
.peak .name {
  color: white;
  font-size: 36px;
  text-align: center;
  margin: 20px;
}
.peak .button {
  position: absolute;
  color: white;
  font-size: 25px;
  margin: 10px;
  right: 0px;
  bottom: 0px;
}
.lin {
  background-color: rgb(135, 162, 235);
  height: 100%;
  border-radius: 10px;
}
.lin img {
  margin-left: 10px;
  margin-top: 5px;
}
.lin .name {
  color: black;
  font-size: 36px;
  text-align: center;
  margin: 20px;
}
.lin .button {
  position: absolute;
  color: white;
  font-size: 25px;
  margin: 10px;
  right: 0px;
  bottom: 0px;
}
.card button {
  float: right;
}
.card .name {
  font-size: 24px;
  color: #303133;
}
.card .tip {
  font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
  text-align: center;
}

.uds {
  margin-left: 4%;
  margin-right: 4%;
  
}
</style>
