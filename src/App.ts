import * as THREE from "three";
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import Stats from "stats.js";
import { getElementSize } from "./dom_utils";

export interface LatLng{
  lat:number,
  lng:number,
}

export default class App{
  sectionElement:HTMLElement;
  controls:TrackballControls;
  stats:Stats;
  points:LatLng[];
  min:LatLng;
  max:LatLng;
  constructor(points:LatLng[]){
    const sectionElement=document.querySelector<HTMLElement>(".p-section-hero");
    if(!sectionElement){
      throw new Error("sectionElement is null");
    }
    this.sectionElement=sectionElement;
    this.stats=new Stats();
    this.stats.dom.style.top="0px";
    document.body.appendChild( this.stats.dom );
    this.points=points;
    this.min=points.reduce((a,b)=>{
      return {
        lat:Math.min(a.lat,b.lat),
        lng:Math.min(a.lng,b.lng),
      }
    })
    this.max=points.reduce((a,b)=>{
      return {
        lat:Math.max(a.lat,b.lat),
        lng:Math.max(a.lng,b.lng),
      }
    })

    const {width,height}=getElementSize(this.sectionElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
    
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( width, height );
    this.sectionElement.appendChild( renderer.domElement );
    
    this.controls=new TrackballControls(camera,renderer.domElement);


    let linesMesh:THREE.Mesh;
    // const segments = this.points.length * this.points.length;
    const segments = this.points.length * 100 * 2;
    let linesMeshShader:THREE.WebGLProgramParametersWithUniforms|null=null;
    {
      const geometry=new THREE.BufferGeometry();
      const positions = new Float32Array( segments * 6 * 3 );
      const colors = new Float32Array( segments * 6 * 3 );
      const uvs = new Float32Array(segments * 6 * 2);
      geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ).setUsage( THREE.DynamicDrawUsage ) );
      geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ).setUsage( THREE.DynamicDrawUsage ) );
      geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ).setUsage( THREE.DynamicDrawUsage ) );

      geometry.computeBoundingSphere();
      geometry.setDrawRange( 0, 0 );

      const material = new THREE.MeshBasicMaterial( {
        vertexColors: true,
        // color:0xffffff,
        blending: THREE.AdditiveBlending,
        depthTest:false,
        transparent: true,
      } );
      linesMesh = new THREE.Mesh(geometry,material);
      {
        const box=new THREE.Box3(new THREE.Vector3(-4,-4,0),new THREE.Vector3(4,4,0));
        const vList=this.points.map((point)=>{
          const v=new THREE.Vector3(
            THREE.MathUtils.mapLinear(point.lng,this.min.lng,this.max.lng,box.min.x,box.max.x),
            THREE.MathUtils.mapLinear(point.lat,this.min.lat,this.max.lat,box.min.y,box.max.y),
            0
          );
          return v;
        });
    
        let vertexpos = 0;
        let colorpos = 0;
        let uvpos=0;
        let numConnected = 0;
  
        const vDiff=new THREE.Vector3();
        const vCamera=new THREE.Vector3(0,0,1);
        const lineWidth=0.01;
        const vSide=new THREE.Vector3();
        const minDistance=(box.max.x - box.min.x)*0.015;
        const colorList:THREE.Color[]=[];
        for(let i=0;i<6;i++){
          const color = new THREE.Color();
          color.setHSL(i/6,1,0.5);
          colorList.push(color);
        }
        new THREE.Color(1,1,1);
        for(let vFrom of vList){
          for(let vTo of vList){
            if(vFrom===vTo){
              continue;
            }
            if(segments<numConnected * 2){
              continue;
            }
            vDiff.x=vTo.x-vFrom.x;
            vDiff.y=vTo.y-vFrom.y;
            vDiff.z=vTo.z-vFrom.z;
            if(vDiff.lengthSq()<minDistance*minDistance){
              vSide.crossVectors(vCamera,vDiff).normalize().multiplyScalar(lineWidth*0.5);
              positions[vertexpos++]=vFrom.x+vSide.x;
              positions[vertexpos++]=vFrom.y+vSide.y;
              positions[vertexpos++]=vFrom.z+vSide.z;
              positions[vertexpos++]=vFrom.x-vSide.x;
              positions[vertexpos++]=vFrom.y-vSide.y;
              positions[vertexpos++]=vFrom.z-vSide.z;
              positions[vertexpos++]=vTo.x-vSide.x;
              positions[vertexpos++]=vTo.y-vSide.y;
              positions[vertexpos++]=vTo.z-vSide.z;
              positions[vertexpos++]=vTo.x-vSide.x;
              positions[vertexpos++]=vTo.y-vSide.y;
              positions[vertexpos++]=vTo.z-vSide.z;
              positions[vertexpos++]=vTo.x+vSide.x;
              positions[vertexpos++]=vTo.y+vSide.y;
              positions[vertexpos++]=vTo.z+vSide.z;
              positions[vertexpos++]=vFrom.x+vSide.x;
              positions[vertexpos++]=vFrom.y+vSide.y;
              positions[vertexpos++]=vFrom.z+vSide.z;
              const color=colorList[numConnected%6];
              for(let i=0;i<6;i++){
                colors[colorpos++]=color.r;
                colors[colorpos++]=color.g;
                colors[colorpos++]=color.b;
              }
              uvs[uvpos++]=0;
              uvs[uvpos++]=0;
              uvs[uvpos++]=0;
              uvs[uvpos++]=1;
              uvs[uvpos++]=1;
              uvs[uvpos++]=1;
  
              uvs[uvpos++]=1;
              uvs[uvpos++]=1;
              uvs[uvpos++]=1;
              uvs[uvpos++]=0;
              uvs[uvpos++]=0;
              uvs[uvpos++]=0;
  
              numConnected++;
            }
  
          }
        }
  
        linesMesh.geometry.setDrawRange( 0, numConnected * 6 );
        linesMesh.geometry.attributes.position.needsUpdate = true;
        linesMesh.geometry.attributes.color.needsUpdate = true;
        linesMesh.geometry.attributes.uv.needsUpdate = true;
        // linesMesh.computeLineDistances();
        // console.log(numConnected/vList.length);
  
      }
      material.onBeforeCompile=(shader)=>{
        linesMeshShader=shader;
        shader.uniforms["uTime"]={value:0};
        shader.vertexShader="#define USE_UV\n"+shader.vertexShader;
        shader.fragmentShader="#define USE_UV\n"+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace("#include <dithering_pars_fragment>",
`#include <dithering_pars_fragment>
uniform float uTime;
`).replace("#include <dithering_fragment>",
`#include <dithering_fragment>
float r=sin(mod(uTime,1.0)*90.0*PI/180.0);
gl_FragColor.rgb*=smoothstep(0.25,0.0,abs(vUv.x-r));
`)
        console.log(shader);
      }
      scene.add(linesMesh);
    }
    
    camera.position.z = 6;
    

    const onResize=()=>{
      const {width,height}=getElementSize(this.sectionElement);
      renderer.setSize(width,height);
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
      this.controls.handleResize();
    }
    window.addEventListener("resize",onResize);
    onResize();

    const animate=()=> {
    
      this.stats.begin();
      this.controls.update();

      if(linesMeshShader){
        linesMeshShader.uniforms["uTime"].value=performance.now()/1000;
      }
      renderer.render( scene, camera );
      this.stats.end();
    
    }
    renderer.setAnimationLoop( animate );
  }
  

}