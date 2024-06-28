import * as THREE from "three";

export interface LatLng{
  lat:number,
  lng:number,
}

export default class App{
  sectionElement:HTMLElement;
  points:LatLng[];
  min:LatLng;
  max:LatLng;
  constructor(points:LatLng[]){
    const sectionElement=document.querySelector<HTMLElement>(".p-section-hero");
    if(!sectionElement){
      throw new Error("sectionElement is null");
    }
    this.sectionElement=sectionElement;
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
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    this.sectionElement.appendChild( renderer.domElement );
    


    let linesMesh:THREE.LineSegments;
    {
      const geometry=new THREE.BufferGeometry();
      const segments = this.points.length * this.points.length;
      const positions = new Float32Array( segments * 3 );
      const colors = new Float32Array( segments * 3 );      
      geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ).setUsage( THREE.DynamicDrawUsage ) );
      geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ).setUsage( THREE.DynamicDrawUsage ) );

      geometry.computeBoundingSphere();
      geometry.setDrawRange( 0, 0 );


      const material = new THREE.LineBasicMaterial( {
        vertexColors: true,
        // color:0xffffff,
        blending: THREE.AdditiveBlending,
        transparent: true,
      } );
      linesMesh = new THREE.LineSegments(geometry,material);
      linesMesh.userData={
        positions,
        colors,
      };
      scene.add(linesMesh);
    }
    
    camera.position.z = 5;
    
    const box=new THREE.Box3(new THREE.Vector3(-3,-3,0),new THREE.Vector3(3,3,0));
    const vList=this.points.map((point)=>{
      const v=new THREE.Vector3(
        THREE.MathUtils.mapLinear(point.lng,this.min.lng,this.max.lng,box.min.x,box.max.x),
        THREE.MathUtils.mapLinear(point.lat,this.min.lat,this.max.lat,box.min.y,box.max.y),
        0
      );
      return v;
    });

    function animate() {
    

      const {
        positions,
        colors,
      }=linesMesh.userData as {
        positions:Float32Array,
        colors:Float32Array,
      };

      let vertexpos = 0;
      let colorpos = 0;
      let numConnected = 0;

      const vDiff=new THREE.Vector3();
      const minDistance=(box.max.x - box.min.x)*0.05;
      for(let vFrom of vList){
        for(let vTo of vList){
          if(vFrom===vTo){
            continue;
          }
          vDiff.x=vTo.x-vFrom.x;
          vDiff.y=vTo.y-vFrom.y;
          vDiff.z=vTo.z-vFrom.z;
          if(vDiff.lengthSq()<minDistance*minDistance){
            positions[vertexpos++]=vFrom.x;
            positions[vertexpos++]=vFrom.y;
            positions[vertexpos++]=vFrom.z;
            positions[vertexpos++]=vTo.x;
            positions[vertexpos++]=vTo.y;
            positions[vertexpos++]=vTo.z;
            colors[colorpos++]=0.25;
            colors[colorpos++]=0.25;
            colors[colorpos++]=0.25;
            colors[colorpos++]=0.25;
            colors[colorpos++]=0.25;
            colors[colorpos++]=0.25;
            numConnected++;
          }

        }
      }

      linesMesh.geometry.setDrawRange( 0, numConnected * 2 );
      linesMesh.geometry.attributes.position.needsUpdate = true;
      linesMesh.geometry.attributes.color.needsUpdate = true;
      linesMesh.computeLineDistances();
  
      renderer.render( scene, camera );
    
    }
  }

}