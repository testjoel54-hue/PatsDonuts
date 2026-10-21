const WEB3FORMS_ACCESS_KEY='YOUR_WEB3FORMS_ACCESS_KEY';
const ENDPOINT='https://api.web3forms.com/submit';
const products=[
  {id:'glazed',name:'Glazed donuts',note:'Classic glazed favorites'},
  {id:'fancy',name:'Fancy & cake donuts',note:'Icing, chocolate, toppings'},
  {id:'holes',name:'Donut holes',note:'Easy sharing size'},
  {id:'rolls',name:'Cinnamon rolls',note:'Sweet rolled pastries'},
  {id:'kolaches',name:'Kolaches',note:'Savory morning option'},
  {id:'drinks',name:'Coffee & drinks',note:'Morning drink request'}
];
const quantities=Object.fromEntries(products.map(p=>[p.id,0]));
const form=document.querySelector('#delivery-form');
const grid=document.querySelector('#product-grid');
const statusBox=document.querySelector('#form-status');
const submitButton=document.querySelector('#submit-order');
const summaryItems=document.querySelector('#summary-items');
const summaryCount=document.querySelector('#summary-count');
const dateInput=document.querySelector('#delivery-date');
const timeInput=document.querySelector('#delivery-time');

function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function renderProducts(){grid.innerHTML=products.map((p,i)=>`<article class="product-choice"><div class="product-orb orb-${i+1}" aria-hidden="true"></div><div class="product-copy"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.note)}</span></div><div class="qty" aria-label="Quantity for ${escapeHtml(p.name)}"><button type="button" data-dec="${p.id}" aria-label="Decrease ${escapeHtml(p.name)}">−</button><output id="qty-${p.id}">${quantities[p.id]}</output><button type="button" data-inc="${p.id}" aria-label="Increase ${escapeHtml(p.name)}">+</button></div></article>`).join('');
  grid.querySelectorAll('[data-inc]').forEach(b=>b.addEventListener('click',()=>{quantities[b.dataset.inc]=Math.min(24,quantities[b.dataset.inc]+1);update();}));
  grid.querySelectorAll('[data-dec]').forEach(b=>b.addEventListener('click',()=>{quantities[b.dataset.dec]=Math.max(0,quantities[b.dataset.dec]-1);update();}));
}
function selected(){return products.filter(p=>quantities[p.id]>0).map(p=>({...p,qty:quantities[p.id]}));}
function update(){for(const p of products){const out=document.querySelector(`#qty-${p.id}`);if(out)out.textContent=quantities[p.id];}const items=selected();const count=items.reduce((n,p)=>n+p.qty,0);summaryCount.textContent=String(count);summaryItems.innerHTML=items.length?items.map(p=>`<div class="summary-item"><span>${escapeHtml(p.name)}</span><strong>× ${p.qty}</strong></div>`).join(''):'<p class="empty-summary">Choose an item to start your order.</p>';}
function setStatus(message,type=''){statusBox.textContent=message;statusBox.className='form-status'+(message?' show':'')+(type?` ${type}`:'');}
function localDate(){const now=new Date();const y=now.getFullYear();const m=String(now.getMonth()+1).padStart(2,'0');const d=String(now.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;}
dateInput.min=localDate();
renderProducts();update();
form.addEventListener('submit',async event=>{
  event.preventDefault();setStatus('');
  if(!form.reportValidity())return;
  const items=selected();if(!items.length){setStatus('Choose at least one item for your delivery request.','error');grid.scrollIntoView({behavior:'smooth',block:'center'});return;}
  const data=new FormData(form);if(String(data.get('website')||'').trim())return;
  if(WEB3FORMS_ACCESS_KEY==='YOUR_WEB3FORMS_ACCESS_KEY'){setStatus('Add your Web3Forms access key in site/assets/delivery.js before using delivery requests.','error');return;}
  if(dateInput.value===localDate()&&timeInput.value){const now=new Date();const [h,m]=timeInput.value.split(':').map(Number);const chosen=new Date();chosen.setHours(h,m,0,0);if(chosen<=now){setStatus('Choose a future delivery time.','error');return;}}
  const list=items.map(p=>`${p.qty} × ${p.name}`).join('\n');
  const payload={
    access_key:WEB3FORMS_ACCESS_KEY,
    subject:`Pat's Donuts delivery request - ${String(data.get('name')).trim()}`,
    from_name:"Pat's Donuts website",
    name:String(data.get('name')).trim(),
    email:String(data.get('email')).trim(),
    phone:String(data.get('phone')).trim(),
    order_items:list,
    custom_request:String(data.get('custom_request')||'').trim()||'None',
    preferred_date:String(data.get('preferred_date')).trim(),
    preferred_time:String(data.get('preferred_time')).trim(),
    delivery_address:String(data.get('delivery_address')).trim(),
    city:String(data.get('city')).trim(),
    state:String(data.get('state')).trim(),
    zip:String(data.get('zip')).trim(),
    delivery_notes:String(data.get('delivery_notes')||'').trim()||'None',
    message:[
      'HOME DELIVERY REQUEST - NOT YET CONFIRMED', '',
      `Customer: ${String(data.get('name')).trim()}`,
      `Phone: ${String(data.get('phone')).trim()}`,
      `Email: ${String(data.get('email')).trim()}`,'',
      'ITEMS:',list,'',
      `Custom request: ${String(data.get('custom_request')||'').trim()||'None'}`,'',
      `Preferred date: ${String(data.get('preferred_date')).trim()}`,
      `Preferred time: ${String(data.get('preferred_time')).trim()}`,
      `Delivery address: ${String(data.get('delivery_address')).trim()}, ${String(data.get('city')).trim()}, ${String(data.get('state')).trim()} ${String(data.get('zip')).trim()}`,
      `Delivery notes: ${String(data.get('delivery_notes')||'').trim()||'None'}`,'',
      'Please confirm availability, delivery area, delivery fee, timing, and total directly with the customer.'
    ].join('\n')
  };
  submitButton.disabled=true;submitButton.setAttribute('aria-busy','true');
  try{
    const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
    const result=await response.json().catch(()=>null);
    if(!response.ok||result?.success!==true)throw new Error(result?.message||'Submission failed');
    form.hidden=true;document.querySelector('.order-summary').hidden=true;const success=document.querySelector('#success-screen');success.hidden=false;document.querySelector('#success-summary').innerHTML=`<strong>${escapeHtml(payload.preferred_date)} at ${escapeHtml(payload.preferred_time)}</strong><span>${escapeHtml(payload.delivery_address)}, ${escapeHtml(payload.city)}, ${escapeHtml(payload.state)} ${escapeHtml(payload.zip)}</span><small>${items.reduce((n,p)=>n+p.qty,0)} item unit${items.reduce((n,p)=>n+p.qty,0)===1?'':'s'} requested</small>`;success.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){setStatus('We could not send your request right now. Please try again or call (972) 418-9543.','error');}
  finally{submitButton.disabled=false;submitButton.setAttribute('aria-busy','false');}
});
