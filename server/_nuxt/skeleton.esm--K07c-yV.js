import { s as script$2 } from "./basecomponent.esm-qug9g1zs.js";
import { B as BaseStyle } from "../server.mjs";
import { openBlock, createElementBlock, mergeProps } from "vue";
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
var inlineStyles = {
  root: {
    position: "relative"
  }
};
var classes = {
  root: function root(_ref) {
    var props = _ref.props;
    return ["p-skeleton p-component", {
      "p-skeleton-circle": props.shape === "circle",
      "p-skeleton-none": props.animation === "none"
    }];
  }
};
var SkeletonStyle = BaseStyle.extend({
  name: "skeleton",
  classes,
  inlineStyles
});
var script$1 = {
  name: "BaseSkeleton",
  "extends": script$2,
  props: {
    shape: {
      type: String,
      "default": "rectangle"
    },
    size: {
      type: String,
      "default": null
    },
    width: {
      type: String,
      "default": "100%"
    },
    height: {
      type: String,
      "default": "1rem"
    },
    borderRadius: {
      type: String,
      "default": null
    },
    animation: {
      type: String,
      "default": "wave"
    }
  },
  style: SkeletonStyle,
  provide: function provide() {
    return {
      $parentInstance: this
    };
  }
};
var script = {
  name: "Skeleton",
  "extends": script$1,
  computed: {
    containerStyle: function containerStyle() {
      if (this.size)
        return {
          width: this.size,
          height: this.size,
          borderRadius: this.borderRadius
        };
      else
        return {
          width: this.width,
          height: this.height,
          borderRadius: this.borderRadius
        };
    }
  }
};
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", mergeProps({
    "class": _ctx.cx("root"),
    style: [_ctx.sx("root"), $options.containerStyle],
    "aria-hidden": "true"
  }, _ctx.ptm("root")), null, 16);
}
script.render = render;
export {
  script as default
};
//# sourceMappingURL=skeleton.esm--K07c-yV.js.map
