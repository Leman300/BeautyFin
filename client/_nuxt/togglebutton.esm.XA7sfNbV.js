import{N as p,O as r,R as c,S as b,v as o,x as s,y as u,T as i,a2 as f,Y as h,V as g,$ as m,z as y}from"./entry.Oqbc3ytE.js";import{s as v}from"./basecomponent.esm.t8RrtfK_.js";var B={root:function(t){var n=t.instance,l=t.props;return["p-togglebutton p-component",{"p-disabled":l.disabled,"p-highlight":n.active,"p-invalid":l.invalid}]},input:"p-togglebutton-input",box:function(t){var n=t.instance;return["p-button p-component",{"p-button-icon-only":n.hasIcon&&!n.hasLabel}]},icon:function(t){var n=t.instance,l=t.props;return["p-button-icon",{"p-button-icon-left":l.iconPos==="left"&&n.label,"p-button-icon-right":l.iconPos==="right"&&n.label}]},label:"p-button-label"},S=p.extend({name:"togglebutton",classes:B}),I={name:"BaseToggleButton",extends:v,props:{modelValue:Boolean,onIcon:String,offIcon:String,onLabel:{type:String,default:"Yes"},offLabel:{type:String,default:"No"},iconPos:{type:String,default:"left"},invalid:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1},readonly:{type:Boolean,default:!1},tabindex:{type:Number,default:null},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:S,provide:function(){return{$parentInstance:this}}},L={name:"ToggleButton",extends:I,emits:["update:modelValue","change","focus","blur"],methods:{getPTOptions:function(t){return this.ptm(t,{context:{active:this.active,disabled:this.disabled}})},onChange:function(t){!this.disabled&&!this.readonly&&(this.$emit("update:modelValue",!this.modelValue),this.$emit("change",t))},onFocus:function(t){this.$emit("focus",t)},onBlur:function(t){this.$emit("blur",t)}},computed:{active:function(){return this.modelValue===!0},hasLabel:function(){return r.isNotEmpty(this.onLabel)&&r.isNotEmpty(this.offLabel)},hasIcon:function(){return this.$slots.icon||this.onIcon&&this.offIcon},label:function(){return this.hasLabel?this.modelValue?this.onLabel:this.offLabel:"&nbsp;"}},directives:{ripple:c}},V=["data-p-highlight","data-p-disabled"],O=["id","value","checked","tabindex","disabled","readonly","aria-labelledby","aria-label"];function P(e,t,n,l,T,a){var d=b("ripple");return o(),s("div",i({class:e.cx("root")},a.getPTOptions("root"),{"data-p-highlight":a.active,"data-p-disabled":e.disabled}),[u("input",i({id:e.inputId,type:"checkbox",role:"switch",class:[e.cx("input"),e.inputClass],style:e.inputStyle,value:e.modelValue,checked:a.active,tabindex:e.tabindex,disabled:e.disabled,readonly:e.readonly,"aria-labelledby":e.ariaLabelledby,"aria-label":e.ariaLabel,onFocus:t[0]||(t[0]=function(){return a.onFocus&&a.onFocus.apply(a,arguments)}),onBlur:t[1]||(t[1]=function(){return a.onBlur&&a.onBlur.apply(a,arguments)}),onChange:t[2]||(t[2]=function(){return a.onChange&&a.onChange.apply(a,arguments)})},a.getPTOptions("input")),null,16,O),f((o(),s("div",i({class:e.cx("box")},a.getPTOptions("box")),[h(e.$slots,"icon",{value:e.modelValue,class:m(e.cx("icon"))},function(){return[e.onIcon||e.offIcon?(o(),s("span",i({key:0,class:[e.cx("icon"),e.modelValue?e.onIcon:e.offIcon]},a.getPTOptions("icon")),null,16)):g("",!0)]}),u("span",i({class:e.cx("label")},a.getPTOptions("label")),y(a.label),17)],16)),[[d]])],16,V)}L.render=P;export{L as default};
