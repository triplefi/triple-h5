<template>
  <svg :class="svgClass" aria-hidden="true">
    <use :xlink:href="iconName" />
  </svg>
</template>
 
<script>
export default {
  name: "SvgIcon",
  props: {
    iconClass: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      default: "",
    },
  },
  computed: {
    iconName() {
      return `#icon-${this.iconClass}`;
    },
    svgClass() {
      if (this.className) {
        return "svg-icon " + this.className;
      } else {
        return "svg-icon";
      }
    },
  },
};
</script>
 
<style lang="scss" scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
.s16 {
  font-size: 16px;
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
}
.s24 {
  font-size: 24px;
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
}
.s40 {
  font-size: 40px;
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
}
</style>