(function(){
  /* Company text: swaps photo and the longer live text, no animation. */
  [].forEach.call(document.querySelectorAll('.company-toggle'),function(btn){
    var scope=btn.closest('section');var box=scope&&scope.querySelector('.company-long');if(!box)return;
    btn.addEventListener('click',function(){
      var open=box.hidden;box.hidden=!open;btn.setAttribute('aria-expanded',String(open));
      var arr=btn.querySelector('svg');btn.firstChild.nodeType===3?btn.firstChild.nodeValue=open?btn.dataset.close:btn.dataset.open:null;
    });
  });
  var sel=document.querySelector('.simple-lang');
  if(sel)sel.addEventListener('change',function(){window.open(sel.value,'_blank','noopener');sel.selectedIndex=0;});
  [].forEach.call(document.querySelectorAll('.cookie-settings'),function(b){b.addEventListener('click',function(e){e.preventDefault();});});
})();
