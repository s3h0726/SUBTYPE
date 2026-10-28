// Optional, isolated renderer. It does not replace the existing Leaflet gameplay.
// SUBTYPE route geometry currently uses [latitude, longitude]; MapLibre uses [longitude, latitude].
const MAPLIBRE_VERSION='6.16.0';
const CSS='https://unpkg.com/maplibre-gl@'+MAPLIBRE_VERSION+'/dist/maplibre-gl.css';
const JS='https://unpkg.com/maplibre-gl@'+MAPLIBRE_VERSION+'/dist/maplibre-gl.mjs';
export function toMapLibreLine(points){
  if(!Array.isArray(points)||points.length<2)throw new Error('At least 2 route vertices are required');
  const coordinates=points.map(p=>{
    const lat=Number(p?.[0]),lon=Number(p?.[1]);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw new Error('Invalid lat/lon route vertex');
    return [lon,lat];
  });
  return {type:'Feature',properties:{source:'SUBTYPE candidate geometry'},geometry:{type:'LineString',coordinates}};
}
export async function createMapLibrePreview({container,pointsLatLng,color='#39ca85',style='https://tiles.openfreemap.org/styles/bright'}){
  if(!container)throw new Error('Container required');
  if(!document.querySelector('link[data-subtype-maplibre]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href=CSS;css.dataset.subtypeMaplibre='1';document.head.append(css);
  }
  const maplibregl=await import(JS);
  const feature=toMapLibreLine(pointsLatLng),coords=feature.geometry.coordinates;
  const map=new maplibregl.Map({container,style,center:coords[0],zoom:12,attributionControl:true});
  map.addControl(new maplibregl.NavigationControl(),'top-right');
  await new Promise((resolve,reject)=>{map.once('load',resolve);map.once('error',reject)});
  map.addSource('subtype-candidate',{type:'geojson',data:feature});
  map.addLayer({id:'subtype-candidate-line',type:'line',source:'subtype-candidate',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':color,'line-width':5}});
  const bounds=coords.reduce((b,c)=>b.extend(c),new maplibregl.LngLatBounds(coords[0],coords[0]));
  map.fitBounds(bounds,{padding:40,maxZoom:16,duration:0});
  return {map,remove:()=>map.remove(),feature};
}
