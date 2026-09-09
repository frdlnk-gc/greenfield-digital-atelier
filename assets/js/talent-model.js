/* Transparent planning model. No candidate database, location inference or empirical placement rate. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GreenfieldTalent=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 function validate(n,p,k){if(!Number.isInteger(n)||n<0||n>500||!Number.isFinite(p)||p<=0||p>=1||!Number.isInteger(k)||k<1||k>10)throw new RangeError('Invalid planning assumptions');}
 // P(X >= k), X binomial(n,p). Sum the complement for stable low-k calculations.
 function probability(n,p,k=1){validate(n,p,k);if(n<k)return 0;let term=Math.pow(1-p,n),below=term;for(let i=1;i<k;i++){term*=((n-i+1)/i)*(p/(1-p));below+=term;}return Math.min(1,Math.max(0,1-below));}
 function conversations(p,k=1,target=.8){validate(0,p,k);if(!Number.isFinite(target)||target<=0||target>=1)throw new RangeError('Invalid target');for(let n=k;n<=500;n++){if(probability(n,p,k)>=target)return n;}throw new RangeError('Scenario exceeds supported range');}
 function plan(p,k,target){const n=conversations(p,k,target);return {conversations:n,probability:probability(n,p,k),rate:p,hires:k,target};}
 return Object.freeze({probability,conversations,plan});
});
