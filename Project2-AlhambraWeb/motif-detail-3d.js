import * as THREE from './assets/vendor/three.module.js';

// Preserve the existing five text states. Only the original left artwork gains depth.
const section=document.querySelector('[data-motif-exchange]');
const media=section?.querySelector('[data-motif-exchange-media]');
const edge=media?.querySelector('.motif-exchange-image--edge');
const canvas=media?.querySelector('[data-motif-model]');
if(canvas && !matchMedia('(prefers-reduced-motion:reduce)').matches){
 initialise().catch(error=>console.warn('Original motif photograph retained.',error));
}
async function initialise(){
 const [reference,texture]=await Promise.all([
  fetch('assets/motif-photo-geometry.json').then(r=>{if(!r.ok)throw Error('Missing photo geometry');return r.json();}),
  new THREE.TextureLoader().loadAsync('assets/motif-user-beaded.png')
 ]);
 texture.colorSpace=THREE.SRGBColorSpace;
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setClearColor(0xffffff,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const scene=new THREE.Scene();const camera=new THREE.OrthographicCamera(-250,250,330,-330,.1,3000);camera.position.z=1600;
 scene.add(new THREE.HemisphereLight(0xffffff,0xa1875d,2.7));
 const key=new THREE.DirectionalLight(0xffedc6,4.5);key.position.set(-500,700,1100);scene.add(key);
 const fill=new THREE.DirectionalLight(0xffffff,3);fill.position.set(500,-100,700);scene.add(fill);
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x94968f);
 for(const [x,y,z,w,h] of [[-3,3,3,4,6],[4,1,2,2,6],[0,4,-2,6,4]]){const card=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));card.position.set(x,y,z);card.lookAt(0,0,0);studio.add(card);}
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.12);scene.environment=environment.texture;pmrem.dispose();
 const root=new THREE.Group();scene.add(root);
 const {width,height,beads,stoneOutline}=reference;
 const gold=new THREE.MeshStandardMaterial({color:0xe6b94f,metalness:1,roughness:.23,envMapIntensity:1.2});
 const onyx=new THREE.MeshPhysicalMaterial({color:0x030303,roughness:.14,clearcoat:1,clearcoatRoughness:.08,metalness:0,envMapIntensity:.3});
 const point=([x,y],z=0)=>new THREE.Vector3(x-width/2,height/2-y,z);
 // The rear bead row follows the 40 front bead centers measured from the supplied image.
 const beadGeometry=new THREE.SphereGeometry(30,22,16);
 for(const center of beads){const bead=new THREE.Mesh(beadGeometry,gold);bead.position.copy(point(center,-65));root.add(bead);}
 const railPoints=beads.map(p=>point(p,-30));
 const rail=new THREE.CatmullRomCurve3(railPoints,true,'centripetal');
 root.add(new THREE.Mesh(new THREE.TubeGeometry(rail,320,18,12,true),gold));
 const stoneShape=new THREE.Shape();stoneOutline.forEach((p,i)=>{const v=point(p);if(i===0)stoneShape.moveTo(v.x,v.y);else stoneShape.lineTo(v.x,v.y);});stoneShape.closePath();
 const stoneBody=new THREE.Mesh(new THREE.ExtrudeGeometry(stoneShape,{depth:58,bevelEnabled:true,bevelSize:3,bevelThickness:3,bevelSegments:3,steps:1}),onyx);stoneBody.position.z=-70;root.add(stoneBody);
 // A photo-matched relief preserves the exact visible bead contour, black stone, and four claws.
 // No invented stone colour, detached layers, or enlarged gold rim is introduced.
 const pixels=document.createElement('canvas');pixels.width=width;pixels.height=height;
 const context=pixels.getContext('2d',{willReadFrequently:true});context.drawImage(texture.image,0,0);
 const rgba=context.getImageData(0,0,width,height).data;
 const surface=new THREE.PlaneGeometry(width,height,244,254),positions=surface.attributes.position;
 const claws=[[442,458],[785,458],[440,784],[785,784]];
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i)+width/2,y=height/2-positions.getY(i);
  const px=Math.max(0,Math.min(width-1,Math.round(x))),py=Math.max(0,Math.min(height-1,Math.round(y))),j=(py*width+px)*4;
  let z=3;
  if(rgba[j]>70 && rgba[j+3]>100){
   z=8;
   for(const [bx,by] of beads){const d=(x-bx)**2+(y-by)**2;if(d<34**2)z=Math.max(z,8+Math.sqrt(34**2-d));}
   for(const [cx,cy] of claws){const d=(x-cx)**2+(y-cy)**2;if(d<38**2)z=Math.max(z,8+Math.sqrt(38**2-d));}
  }
  positions.setZ(i,z);
 }
 positions.needsUpdate=true;surface.computeVertexNormals();
 const front=new THREE.Mesh(surface,new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.08,side:THREE.DoubleSide,toneMapped:false}));root.add(front);
 const stage=section.querySelector('[data-motif-exchange-stage]');
 const wide=matchMedia('(min-width:901px)');
 let target=0,current=0,visible=false,raf=0,lastFrame=0,baseScale=.3,centerX=0,centerY=0;
 const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>n*n*(3-2*n);
 const poses=[
  {p:0,zoom:1,rx:0,ry:0,x:0,y:0},
  {p:.59,zoom:1,rx:0,ry:0,x:0,y:0},
  {p:.66,zoom:1.62,rx:.18,ry:-.24,x:0,y:-12},
  {p:.75,zoom:1.18,rx:0,ry:0,x:0,y:0},
  {p:.85,zoom:1.3,rx:-.12,ry:.22,x:0,y:0},
  {p:.91,zoom:1.2,rx:0,ry:0,x:0,y:0},
  {p:1,zoom:1.46,rx:.2,ry:-.66,x:0,y:0}
 ];
 function pose(p){let i=0;while(i<poses.length-2&&p>poses[i+1].p)i++;const a=poses[i],b=poses[i+1],t=smooth(clamp((p-a.p)/(b.p-a.p)));return Object.fromEntries(Object.keys(a).map(k=>[k,THREE.MathUtils.lerp(a[k],b[k],t)]));}
 function measure(){
  if(!wide.matches){media.style.setProperty('--model-reveal','0');return;}
  const bounds=section.getBoundingClientRect(),nav=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'))||63;
  target=window.getMotifReadingProgress(section,stage,nav);
  const w=media.clientWidth,h=media.clientHeight,box=edge.getBoundingClientRect(),host=media.getBoundingClientRect();
  renderer.setSize(w,h,false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();
  baseScale=Math.min(box.width/width,box.height/height);
  centerX=box.left+box.width/2-host.left-host.width/2;
  centerY=-(box.top+box.height/2-host.top-host.height/2);
  if(!raf)raf=requestAnimationFrame(draw);
 }
 function draw(now){
  const elapsed=lastFrame?Math.min(50,now-lastFrame):16.7;lastFrame=now;
  raf=0;current=THREE.MathUtils.lerp(current,target,1-Math.exp(-elapsed/260));if(Math.abs(current-target)<.0001)current=target;
  const p=pose(current),reveal=smooth(clamp((current-.54)/.055));
  root.scale.setScalar(baseScale*p.zoom);root.rotation.set(p.rx,p.ry,0);root.position.set(centerX+p.x,centerY+p.y,0);
  media.style.setProperty('--model-reveal',reveal.toFixed(4));
  media.dataset.detailView=target<.54?'original':target<.75?'beads':target<.91?'material':'frame';
  renderer.render(scene,camera);
  if(visible&&current!==target)raf=requestAnimationFrame(draw);
 }
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)measure();},{rootMargin:'150px'});observer.observe(section);
 let pending=false;addEventListener('scroll',()=>{if(visible&&!pending){pending=true;requestAnimationFrame(()=>{pending=false;measure();});}},{passive:true});
 addEventListener('resize',measure,{passive:true});wide.addEventListener('change',measure);
 canvas.addEventListener('webglcontextlost',()=>media.classList.remove('is-model-ready'));
 media.classList.add('is-model-ready');measure();
}
