import{s as l}from"./basecomponent.esm.t8RrtfK_.js";import{N as n,v as r,x as o,T as u}from"./entry.Oqbc3ytE.js";var p={root:function(t){var s=t.instance,a=t.props;return["p-inputtextarea p-inputtext p-component",{"p-filled":s.filled,"p-inputtextarea-resizable ":a.autoResize,"p-invalid":a.invalid,"p-variant-filled":a.variant?a.variant==="filled":s.$primevue.config.inputStyle==="filled"}]}},d=n.extend({name:"textarea",classes:p}),h={name:"BaseTextarea",extends:l,props:{modelValue:null,autoResize:Boolean,invalid:{type:Boolean,default:!1},variant:{type:String,default:null}},style:d,provide:function(){return{$parentInstance:this}}},f={name:"Textarea",extends:h,emits:["update:modelValue"],mounted:function(){this.$el.offsetParent&&this.autoResize&&this.resize()},updated:function(){this.$el.offsetParent&&this.autoResize&&this.resize()},methods:{resize:function(){this.$el.style.height="auto",this.$el.style.height=this.$el.scrollHeight+"px",parseFloat(this.$el.style.height)>=parseFloat(this.$el.style.maxHeight)?(this.$el.style.overflowY="scroll",this.$el.style.height=this.$el.style.maxHeight):this.$el.style.overflow="hidden"},onInput:function(t){this.autoResize&&this.resize(),this.$emit("update:modelValue",t.target.value)}},computed:{filled:function(){return this.modelValue!=null&&this.modelValue.toString().length>0},ptmParams:function(){return{context:{disabled:this.$attrs.disabled||this.$attrs.disabled===""}}}}},m=["value"];function c(e,t,s,a,v,i){return r(),o("textarea",u({class:e.cx("root"),value:e.modelValue,onInput:t[0]||(t[0]=function(){return i.onInput&&i.onInput.apply(i,arguments)})},e.ptm("root",i.ptmParams)),null,16,m)}f.render=c;export{f as default};
