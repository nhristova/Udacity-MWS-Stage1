const showMessage=function(a,b,c={}){let d=document.getElementById('toast-container'),e=document.createElement('div');return e.classList.add('toast',b),e.innerHTML=a,d.insertAdjacentElement('beforeend',e),c.onclick||this.options.onclick?void e.addEventListener('click',c.onclick?c.onclick:this.options.onclick):void setTimeout(()=>d.removeChild(e),this.options.timeOut)};export const toasty={type:{error:'toast-error',info:'toast-info',success:'toast-success',warning:'toast-warning'},options:{onclick:!1,timeOut:5e3},showMessage:showMessage};