import { s as script$4 } from "./index.esm-6uJ27MAP.js";
import { s as script$3 } from "./baseicon.esm-URWkj5Lr.js";
import { openBlock, createElementBlock, mergeProps, createElementVNode, resolveComponent, renderSlot, createVNode, normalizeProps, guardReactiveProps } from "vue";
import { s as script$5 } from "./basecomponent.esm-qug9g1zs.js";
import { B as BaseStyle } from "../server.mjs";
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
var script$2 = {
  name: "ThLargeIcon",
  "extends": script$3
};
var _hoisted_1$1 = /* @__PURE__ */ createElementVNode("path", {
  "fill-rule": "evenodd",
  "clip-rule": "evenodd",
  d: "M1.90909 6.36364H4.45455C4.96087 6.36364 5.44645 6.1625 5.80448 5.80448C6.1625 5.44645 6.36364 4.96087 6.36364 4.45455V1.90909C6.36364 1.40277 6.1625 0.917184 5.80448 0.55916C5.44645 0.201136 4.96087 0 4.45455 0H1.90909C1.40277 0 0.917184 0.201136 0.55916 0.55916C0.201136 0.917184 0 1.40277 0 1.90909V4.45455C0 4.96087 0.201136 5.44645 0.55916 5.80448C0.917184 6.1625 1.40277 6.36364 1.90909 6.36364ZM1.46154 1.46154C1.58041 1.34268 1.741 1.27492 1.90909 1.27273H4.45455C4.62264 1.27492 4.78322 1.34268 4.90209 1.46154C5.02096 1.58041 5.08871 1.741 5.09091 1.90909V4.45455C5.08871 4.62264 5.02096 4.78322 4.90209 4.90209C4.78322 5.02096 4.62264 5.08871 4.45455 5.09091H1.90909C1.741 5.08871 1.58041 5.02096 1.46154 4.90209C1.34268 4.78322 1.27492 4.62264 1.27273 4.45455V1.90909C1.27492 1.741 1.34268 1.58041 1.46154 1.46154ZM1.90909 14H4.45455C4.96087 14 5.44645 13.7989 5.80448 13.4408C6.1625 13.0828 6.36364 12.5972 6.36364 12.0909V9.54544C6.36364 9.03912 6.1625 8.55354 5.80448 8.19551C5.44645 7.83749 4.96087 7.63635 4.45455 7.63635H1.90909C1.40277 7.63635 0.917184 7.83749 0.55916 8.19551C0.201136 8.55354 0 9.03912 0 9.54544V12.0909C0 12.5972 0.201136 13.0828 0.55916 13.4408C0.917184 13.7989 1.40277 14 1.90909 14ZM1.46154 9.0979C1.58041 8.97903 1.741 8.91128 1.90909 8.90908H4.45455C4.62264 8.91128 4.78322 8.97903 4.90209 9.0979C5.02096 9.21677 5.08871 9.37735 5.09091 9.54544V12.0909C5.08871 12.259 5.02096 12.4196 4.90209 12.5384C4.78322 12.6573 4.62264 12.7251 4.45455 12.7273H1.90909C1.741 12.7251 1.58041 12.6573 1.46154 12.5384C1.34268 12.4196 1.27492 12.259 1.27273 12.0909V9.54544C1.27492 9.37735 1.34268 9.21677 1.46154 9.0979ZM12.0909 6.36364H9.54544C9.03912 6.36364 8.55354 6.1625 8.19551 5.80448C7.83749 5.44645 7.63635 4.96087 7.63635 4.45455V1.90909C7.63635 1.40277 7.83749 0.917184 8.19551 0.55916C8.55354 0.201136 9.03912 0 9.54544 0H12.0909C12.5972 0 13.0828 0.201136 13.4408 0.55916C13.7989 0.917184 14 1.40277 14 1.90909V4.45455C14 4.96087 13.7989 5.44645 13.4408 5.80448C13.0828 6.1625 12.5972 6.36364 12.0909 6.36364ZM9.54544 1.27273C9.37735 1.27492 9.21677 1.34268 9.0979 1.46154C8.97903 1.58041 8.91128 1.741 8.90908 1.90909V4.45455C8.91128 4.62264 8.97903 4.78322 9.0979 4.90209C9.21677 5.02096 9.37735 5.08871 9.54544 5.09091H12.0909C12.259 5.08871 12.4196 5.02096 12.5384 4.90209C12.6573 4.78322 12.7251 4.62264 12.7273 4.45455V1.90909C12.7251 1.741 12.6573 1.58041 12.5384 1.46154C12.4196 1.34268 12.259 1.27492 12.0909 1.27273H9.54544ZM9.54544 14H12.0909C12.5972 14 13.0828 13.7989 13.4408 13.4408C13.7989 13.0828 14 12.5972 14 12.0909V9.54544C14 9.03912 13.7989 8.55354 13.4408 8.19551C13.0828 7.83749 12.5972 7.63635 12.0909 7.63635H9.54544C9.03912 7.63635 8.55354 7.83749 8.19551 8.19551C7.83749 8.55354 7.63635 9.03912 7.63635 9.54544V12.0909C7.63635 12.5972 7.83749 13.0828 8.19551 13.4408C8.55354 13.7989 9.03912 14 9.54544 14ZM9.0979 9.0979C9.21677 8.97903 9.37735 8.91128 9.54544 8.90908H12.0909C12.259 8.91128 12.4196 8.97903 12.5384 9.0979C12.6573 9.21677 12.7251 9.37735 12.7273 9.54544V12.0909C12.7251 12.259 12.6573 12.4196 12.5384 12.5384C12.4196 12.6573 12.259 12.7251 12.0909 12.7273H9.54544C9.37735 12.7251 9.21677 12.6573 9.0979 12.5384C8.97903 12.4196 8.91128 12.259 8.90908 12.0909V9.54544C8.91128 9.37735 8.97903 9.21677 9.0979 9.0979Z",
  fill: "currentColor"
}, null, -1);
var _hoisted_2$1 = [_hoisted_1$1];
function render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("svg", mergeProps({
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _ctx.pti()), _hoisted_2$1, 16);
}
script$2.render = render$1;
var classes = {
  root: "p-dataview-layout-options p-selectbutton p-buttonset",
  listButton: function listButton(_ref) {
    var props = _ref.props;
    return ["p-button p-button-icon-only", {
      "p-highlight": props.modelValue === "list"
    }];
  },
  gridButton: function gridButton(_ref2) {
    var props = _ref2.props;
    return ["p-button p-button-icon-only", {
      "p-highlight": props.modelValue === "grid"
    }];
  }
};
var DataViewLayoutOptionsStyle = BaseStyle.extend({
  name: "dataviewlayoutoptions",
  classes
});
var script$1 = {
  name: "BaseDataViewLayoutOptions",
  "extends": script$5,
  props: {
    modelValue: String
  },
  style: DataViewLayoutOptionsStyle,
  provide: function provide() {
    return {
      $parentInstance: this
    };
  }
};
var script = {
  name: "DataViewLayoutOptions",
  "extends": script$1,
  emits: ["update:modelValue"],
  data: function data() {
    return {
      isListButtonPressed: false,
      isGridButtonPressed: false
    };
  },
  methods: {
    changeLayout: function changeLayout(layout) {
      this.$emit("update:modelValue", layout);
      if (layout === "list") {
        this.isListButtonPressed = true;
        this.isGridButtonPressed = false;
      } else if (layout === "grid") {
        this.isGridButtonPressed = true;
        this.isListButtonPressed = false;
      }
    }
  },
  computed: {
    listViewAriaLabel: function listViewAriaLabel() {
      return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.listView : void 0;
    },
    gridViewAriaLabel: function gridViewAriaLabel() {
      return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.gridView : void 0;
    }
  },
  components: {
    BarsIcon: script$4,
    ThLargeIcon: script$2
  }
};
var _hoisted_1 = ["aria-label", "aria-pressed"];
var _hoisted_2 = ["aria-label", "aria-pressed"];
function render(_ctx, _cache, $props, $setup, $data, $options) {
  var _component_BarsIcon = resolveComponent("BarsIcon");
  var _component_ThLargeIcon = resolveComponent("ThLargeIcon");
  return openBlock(), createElementBlock("div", mergeProps({
    "class": _ctx.cx("root"),
    role: "group"
  }, _ctx.ptm("root")), [createElementVNode("button", mergeProps({
    "aria-label": $options.listViewAriaLabel,
    "class": _ctx.cx("listButton"),
    onClick: _cache[0] || (_cache[0] = function($event) {
      return $options.changeLayout("list");
    }),
    type: "button",
    "aria-pressed": $data.isListButtonPressed
  }, _ctx.ptm("listButton")), [renderSlot(_ctx.$slots, "listicon", {}, function() {
    return [createVNode(_component_BarsIcon, normalizeProps(guardReactiveProps(_ctx.ptm("listIcon"))), null, 16)];
  })], 16, _hoisted_1), createElementVNode("button", mergeProps({
    "aria-label": $options.gridViewAriaLabel,
    "class": _ctx.cx("gridButton"),
    onClick: _cache[1] || (_cache[1] = function($event) {
      return $options.changeLayout("grid");
    }),
    type: "button",
    "aria-pressed": $data.isGridButtonPressed
  }, _ctx.ptm("gridButton")), [renderSlot(_ctx.$slots, "gridicon", {}, function() {
    return [createVNode(_component_ThLargeIcon, normalizeProps(guardReactiveProps(_ctx.ptm("gridIcon"))), null, 16)];
  })], 16, _hoisted_2)], 16);
}
script.render = render;
export {
  script as default
};
//# sourceMappingURL=dataviewlayoutoptions.esm--5jVALlb.js.map
