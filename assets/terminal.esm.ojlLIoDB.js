import{ad as c,J as u,v as a,x as p,a0 as f,N as t,z as m,P as v,y as o,Q as y,S as T,_ as g,a4 as h}from"./entry.UtMeiz_E.js";import{s as w}from"./basecomponent.esm.aDhQjxH1.js";var l=c(),k={root:"p-terminal p-component",content:"p-terminal-content",prompt:"p-terminal-prompt",command:"p-terminal-command",response:"p-terminal-response",container:"p-terminal-prompt-container",commandText:"p-terminal-input"},S=u.extend({name:"terminal",classes:k}),x={name:"BaseTerminal",extends:w,props:{welcomeMessage:{type:String,default:null},prompt:{type:String,default:null}},style:S,provide:function(){return{$parentInstance:this}}},C={name:"Terminal",extends:x,data:function(){return{commandText:null,commands:[]}},mounted:function(){l.on("response",this.responseListener),this.$refs.input.focus()},updated:function(){this.$el.scrollTop=this.$el.scrollHeight},beforeUnmount:function(){l.off("response",this.responseListener)},methods:{onClick:function(){this.$refs.input.focus()},onKeydown:function(n){(n.code==="Enter"||n.code==="NumpadEnter")&&this.commandText&&(this.commands.push({text:this.commandText}),l.emit("command",this.commandText),this.commandText="")},responseListener:function(n){this.commands[this.commands.length-1].response=n}}};function B(e,n,K,L,i,s){return a(),p("div",t({class:e.cx("root"),onClick:n[2]||(n[2]=function(){return s.onClick&&s.onClick.apply(s,arguments)})},e.ptm("root")),[e.welcomeMessage?(a(),p("div",f(t({key:0},e.ptm("welcomeMessage"))),m(e.welcomeMessage),17)):v("",!0),o("div",t({class:e.cx("content")},e.ptm("content")),[(a(!0),p(y,null,T(i.commands,function(r,d){return a(),p("div",t({key:r.text+d.toString()},e.ptm("commands")),[o("span",t({class:e.cx("prompt")},e.ptm("prompt")),m(e.prompt),17),o("span",t({class:e.cx("command")},e.ptm("command")),m(r.text),17),o("div",t({class:e.cx("response"),"aria-live":"polite"},e.ptm("response")),m(r.response),17)],16)}),128))],16),o("div",t({class:e.cx("container")},e.ptm("container")),[o("span",t({class:e.cx("prompt")},e.ptm("prompt")),m(e.prompt),17),g(o("input",t({ref:"input","onUpdate:modelValue":n[0]||(n[0]=function(r){return i.commandText=r}),type:"text",class:e.cx("commandText"),autocomplete:"off",onKeydown:n[1]||(n[1]=function(){return s.onKeydown&&s.onKeydown.apply(s,arguments)})},e.ptm("commandText")),null,16),[[h,i.commandText]])],16)],16)}C.render=B;export{C as default};