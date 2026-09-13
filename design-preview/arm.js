// Standalone approval study. Not imported by the simulator.
import { Engine, Scene, ArcRotateCamera, Vector3, Color3, Color4, HemisphericLight,
  DirectionalLight, PBRMaterial, MeshBuilder, Mesh, VertexData, TransformNode,
  RawCubeTexture, Constants, Layer } from '@babylonjs/core';

const canvas = document.querySelector('#model');
const engine = new Engine(canvas, true, {preserveDrawingBuffer:true, stencil:true});
const scene = new Scene(engine);
scene.clearColor = new Color4(.93,.918,.898,1);
scene.imageProcessingConfiguration.toneMappingEnabled = true;
scene.imageProcessingConfiguration.toneMappingType = 1;
scene.imageProcessingConfiguration.exposure = 1.25;
const camera = new ArcRotateCamera('inspection', Math.PI/2, Math.PI/2, 27, Vector3.Zero(), scene);
camera.attachControl(canvas,true); camera.minZ=.1; camera.lowerRadiusLimit=8; camera.upperRadiusLimit=50;
camera.wheelPrecision=25; camera.panningSensibility=130;
const fill = new HemisphericLight('studio-fill',new Vector3(0,1,1),scene); fill.intensity=.6;
fill.groundColor = new Color3(.45,.38,.31);
const key = new DirectionalLight('large-key', new Vector3(-1,-2,3),scene); key.intensity=2.5;
const rim = new DirectionalLight('warm-rim', new Vector3(1,0,2),scene); rim.diffuse=new Color3(1,.67,.42);rim.intensity=2;

// Original procedural studio reflection cube: broad softboxes, no remote assets.
const size=128;
const faces = Array.from({length:6},(_,face)=>{
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=(x/size-.5)*2,v=(y/size-.5)*2;
    const box=Math.exp(-Math.pow((u-.15)/.38,8)-Math.pow(v/.88,8));
    const strip=Math.exp(-Math.pow((u+.65)/.13,4)-Math.pow(v/.95,6));
    const bright=(face===2?.75:.16)+box*(face===0||face===4?.8:.35)+strip*.5;
    const i=(y*size+x)*4; data[i]=Math.min(255,bright*255);data[i+1]=Math.min(255,bright*250);data[i+2]=Math.min(255,bright*242);data[i+3]=255;
  }return data;
});
scene.environmentTexture=new RawCubeTexture(scene,faces,size,Constants.TEXTUREFORMAT_RGBA,Constants.TEXTURETYPE_UNSIGNED_BYTE,true,false,Constants.TEXTURE_TRILINEAR_SAMPLINGMODE);
function material(name,hex,metal,rough){const m=new PBRMaterial(name,scene);m.albedoColor=Color3.FromHexString(hex);m.metallic=metal;m.roughness=rough;return m;}
const steel=material('satin surgical steel','#c4c6c5',.88,.27);
const edge=material('machined edges','#d9dcdb',.96,.17);
const dark=material('recesses','#24282c',.6,.38);
const black=material('black polymer sleeve','#101216',.05,.58); black.environmentIntensity=.28;
const toothSteel=material('jaw gripping surface','#656967',.9,.38);
const root=new TransformNode('instrument',scene);
function mount(mesh,mat,parent=root){mesh.material=mat;mesh.parent=parent;return mesh;}
function cyl(name,x,len,r,mat,parent=root,axis='x',r2=r){
  const m=mount(MeshBuilder.CreateCylinder(name,{height:len,diameterTop:r2*2,diameterBottom:r*2,tessellation:64},scene),mat,parent);
  if(axis==='x')m.rotation.z=-Math.PI/2;else if(axis==='z')m.rotation.x=Math.PI/2;
  m.position.x=x;return m;
}
// Rounded rectangular section loft; gives housings and jaws real continuous surfaces.
function loft(name,sections,mat,parent=root){
  const n=32,positions=[],indices=[],normals=[];
  for(const [x,y,hy,hz] of sections)for(let k=0;k<n;k++){
    const a=k/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
    positions.push(x,y+hy*Math.sign(c)*Math.pow(Math.abs(c),.55),hz*Math.sign(s)*Math.pow(Math.abs(s),.55));
  }
  for(let j=0;j<sections.length-1;j++)for(let k=0;k<n;k++){
    const a=j*n+k,b=j*n+(k+1)%n,c=b+n,d=a+n;indices.push(a,b,c,a,c,d);
  }
  for(let k=1;k<n-1;k++){indices.push(0,k+1,k);const a=(sections.length-1)*n;indices.push(a,a+k,a+k+1);}
  VertexData.ComputeNormals(positions,indices,normals);
  for(let i=0;i<normals.length;i++)normals[i]*=-1;
  const vd=new VertexData();vd.positions=positions;vd.indices=indices;vd.normals=normals;
  const mesh=new Mesh(name,scene);vd.applyToMesh(mesh);mesh.material=mat;mesh.parent=parent;mat.backFaceCulling=false;return mesh;
}
cyl('long black sleeve',-12,17,1.04,black,root,'x',.96);
cyl('sleeve rim',-3.58,.18,1.08,edge);
cyl('metal cuff',-3.04,.92,1.07,steel,root,'x',.97);
cyl('cuff seam',-2.57,.05,.98,dark);
const wrist=new TransformNode('articulated distal assembly',scene);wrist.parent=root;wrist.position.x=-2.55;
cyl('wrist barrel',.68,1.35,.69,dark,wrist);
for(const z of [-.76,.76]){
  const shell=loft('cuff clevis shell',[[0,0,.78,.13],[.18,0,.82,.17],[1.35,0,.62,.17],[1.65,0,.36,.1]],steel,wrist);shell.position.z=z;
}
const hand=new TransformNode('distal wrist',scene);hand.parent=wrist;hand.position.x=1.4;
cyl('transverse wrist axle',0,1.96,.37,edge,hand,'z');
loft('smooth broad metal wrist housing',[[-.35,0,.43,.48],[-.15,0,.71,.66],[.2,0,.82,.71],[1.15,0,.72,.63],[1.72,0,.47,.42],[1.9,0,.34,.32]],steel,hand);
for(const z of [-.71,.71]){
  const plate=loft('raised side cheek',[[.05,0,.48,.07],[.22,0,.59,.12],[.95,0,.5,.12],[1.45,0,.31,.05]],edge,hand);plate.position.z=z;
}
function screw(name,x,y,z,parent,rad=.12){
 const m=cyl(name,x,.10,rad,edge,parent,'z');m.position.y=y;m.position.z=z;
 const slot=mount(MeshBuilder.CreateBox(name+' slot',{width:rad*1.2,height:.025,depth:.012},scene),dark,parent);slot.position.set(x,y,z+(z<0?-.056:.056));slot.rotation.z=.6;
}
for(const z of [-1.02,1.02])screw('wrist axle cap',0,0,z,hand,.29);
for(const z of [-.87,.87]){screw('cuff screw',.2,.37,z,wrist,.11);screw('cuff screw',.2,-.37,z,wrist,.11);screw('cheek fastener',.9,0,z,hand,.12);}
for(const side of [-1,1]){
 const link=loft('side linkage',[[-.1,0,.13,.09],[.1,0,.16,.12],[1.5,0,.12,.11],[1.7,0,.08,.07]],steel,hand);link.position.y=side*.65;link.position.z=-.15;
 screw('linkage fastener',.15,side*.65,.17,hand,.10);
}
cyl('jaw central hinge',2.02,.9,.28,dark,hand,'z');
const jaws=[];
for(const side of [-1,1]){
 const jaw=new TransformNode(side>0?'upper jaw':'lower jaw',scene);jaw.parent=hand;jaw.position.set(2.0,side*.12,0);jaws.push(jaw);
 const sections=[[0,side*.15,.23,.34],[.3,side*.15,.25,.34],[.65,side*.12,.22,.29],[1.25,side*.08,.17,.23],[2.0,side*.03,.12,.16],[2.52,0,.095,.10],[2.65,0,.045,.055]];
 loft('tapered rounded jaw',sections,steel,jaw);
 for(let i=0;i<22;i++){
  const x=.42+i*.094,hy=.21-(x-.42)*.063;
  const tooth=mount(MeshBuilder.CreateBox('individual jaw serration',{width:.045,height:.075,depth:Math.max(.15,.58-x*.15)},scene),toothSteel,jaw);
  tooth.position.set(x,side*(.14-x*.06-hy-.018),0);
 }
 screw('jaw pivot screw',.07,side*.15,.375,jaw,.145);
}
const backdrop=new Layer('optional cavity','/assets/environment/anatomical-cavity-navigation.png',scene,true);backdrop.isEnabled=false;
function setJaws(value){jaws.forEach((jaw,i)=>jaw.rotation.z=(i===0?-1:1)*Number(value)*Math.PI/180);}
// Array starts at lower jaw; opposing signed rotations open both gripping faces.
setJaws(16);
function view(name){
 root.position.set(3,-2,0);root.rotation.set(.08,-.18,2.60);
 camera.setTarget(Vector3.Zero());camera.alpha=-Math.PI/2;camera.beta=Math.PI/2;camera.radius=23;
 if(name==='detail'){root.position.set(1,-.7,0);root.rotation.set(.10,-.25,2.8);camera.radius=12;}
 if(name==='side'){root.position.set(0,0,0);root.rotation.set(0,0,Math.PI);camera.radius=18;}
 document.querySelector('#view-label').textContent=name==='detail'?'Wrist close-up · inspect housing and jaws':name==='side'?'Side profile · inspect silhouette':'First-person · open jaws';
}
view('first');
for(const name of ['first','detail','side'])document.querySelector('#'+name).onclick=()=>view(name);
document.querySelector('#jaw').oninput=e=>setJaws(e.target.value);
document.querySelector('#bend').oninput=e=>hand.rotation.z=Number(e.target.value)*Math.PI/180;
document.querySelector('#background').onclick=()=>{backdrop.isEnabled=!backdrop.isEnabled;document.querySelector('#background').textContent=backdrop.isEnabled?'Studio backdrop':'Cavity backdrop';};
engine.runRenderLoop(()=>scene.render());window.addEventListener('resize',()=>engine.resize());
