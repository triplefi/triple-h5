// 获取svg文件的 [className]
const fs = require("fs");

let svgs = []
let icons = []
let other = []
const files = fs.readdirSync('./svg')
files.forEach(function (item) {
  // 压缩或者bese文件是没有相对应的页面的,这里做排除
  if (item.slice(0, 3) === 'ic_') {
    icons.push(item.split('.')[0])
  } else {
    other.push(item.split('.')[0])
  }
})
svgs = other.concat(icons)
console.log(svgs)