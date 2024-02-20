import { B as BaseStyle } from "../server.mjs";
import { s as script$2 } from "./basecomponent.esm-qug9g1zs.js";
import { openBlock, createElementBlock, mergeProps, renderSlot } from "vue";
import "#internal/nitro";
import "ofetch";
import "hookable";
import "unctx";
import "h3";
import "unhead";
import "@unhead/shared";
import "vue-router";
import "ufo";
import "defu";
import "klona";
import "devalue";
import "destr";
import "vue/server-renderer";
var classes = {
  root: "p-avatar-group p-component"
};
var AvatarGroupStyle = BaseStyle.extend({
  name: "avatargroup",
  classes
});
var script$1 = {
  name: "BaseAvatarGroup",
  "extends": script$2,
  style: AvatarGroupStyle,
  provide: function provide() {
    return {
      $parentInstance: this
    };
  }
};
var script = {
  name: "AvatarGroup",
  "extends": script$1
};
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", mergeProps({
    "class": _ctx.cx("root")
  }, _ctx.ptm("root")), [renderSlot(_ctx.$slots, "default")], 16);
}
script.render = render;
export {
  script as default
};
//# sourceMappingURL=avatargroup.esm-y5gBkMK1.js.map
