import App, { LatLng } from './App';
import './style.scss'
import {XMLParser} from "fast-xml-parser";


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <section class="p-section-hero"></section>
`


async function mainAsync(){
  const points=[];
  const gmlUrlList=[];
  for(let code=1;code<=47;code+=1){
    gmlUrlList.push(`./P34-14_${("0"+code).slice(-2)}.xml`);
  }
  for(let gmlUrl of gmlUrlList){
    const xmlData = await fetch(gmlUrl).then((res)=>res.text());
    const parser = new XMLParser({
      ignoreAttributes:false,
    });
    const obj=parser.parse(xmlData);
    // console.log(obj);
    const subpoints:LatLng[]=obj?.["ksj:Dataset"]?.["gml:Point"]?.map((element:any)=>element?.["gml:pos"]).filter((point?:string)=>!!point).map((point:string)=>{
      const [lat,lng]=point.split(" ");
      return {
        lat:parseFloat(lat),
        lng:parseFloat(lng),
      }
    });
    points.push(...subpoints);
  
  }
  // console.log(points);
  (window as any).app=new App(points);


  
}

mainAsync().catch((error)=>{
  console.error(error);
})