<template>
  <div class="about">
    <h1>This is an about page {{ count }}</h1>
    <el-button type="info" round>LONG</el-button>
    <el-button type="danger" round>SHORT</el-button>
    <el-button type="primary" round @click="submit">Submit</el-button>
    <div style="height: 15px"></div>
    <el-row>
      <el-col :span="12">
        <el-input v-model="value" placeholder="输入"></el-input>
        <div style="height: 15px"></div>
        <el-input-number
          v-model="num"
          :precision="2"
          :step="0.01"
          :min="10"
          :max="4212"
        ></el-input-number>
        <div style="height: 15px"></div>
        <el-switch
          inactive-color="#F2F2F7"
          :width="51"
          v-model="sw"
        ></el-switch>
        <div style="height: 15px"></div>
        <el-slider v-model="sl" :min="10" :max="4212"></el-slider>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <div class="svgs">
          <div v-for="item in svgs" :key="item">
            <svg-icon :icon-class="item"></svg-icon>
            <div class="fs16b">{{ item }}</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  data() {
    return {
      value: "",
      num: "",
      sw: true,
      activeName: "1",
      sl: 10,
      svgs: [
        "Logo",
        "Logo_2",
        "TripleLogo",
        "bj",
        "off",
        "on",
        "ic_16note",
        "ic_16qs",
        "ic_Add",
        "ic_AuxiliaryGraphics",
        "ic_Full1",
        "ic_Full2",
        "ic_Nothing",
        "ic_Search",
        "ic_Select",
        "ic_Setting",
        "ic_close",
        "ic_math",
        "ic_metamask",
        "ic_trust",
        "ic_wallet",
      ],
    };
  },
  computed: {
    ...mapState({
      // 箭头函数可使代码更简练
      count: (state) => state.count,
    }),
  },
  methods: {
    submit() {
      this.$message({
        type: "success",
        message:
          "this is message, this is message, this is message, this is message, this is message, this is message, this is message, ",
        duration: 10000,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.about {
  padding: 50px;
  background-color: var(--COLOR-bg1);
  h1 {
    color: var(--COLOR-c5);
  }
}
.svgs {
  > div {
    margin: 15px;
    display: inline-block;
    padding: 10px;
    width: 100px;
    background-color: var(--COLOR-bg3);
    border-radius: 4px;
    text-align: center;
    &:hover {
      background-color: var(--COLOR-bg2);
    }
    svg {
      font-size: 40px;
    }
  }
}
</style>