const map = L.map('map').setView([21,78],5);

// city nodes
const cities = {
  pune:{id:0,coords:[18.5204,73.8567]},
  mumbai:{id:1,coords:[19.0760,72.8777]},
  nashik:{id:2,coords:[19.9975,73.7898]},
  aurangabad:{id:3,coords:[19.8762,75.3433]},
  nagpur:{id:4,coords:[21.1458,79.0882]},
  delhi:{id:5,coords:[28.6139,77.2090]}
};

// graph adjacency list
const graph = {
  0:[{node:1,weight:150},{node:2,weight:210}],
  1:[{node:0,weight:150},{node:3,weight:330}],
  2:[{node:0,weight:210},{node:3,weight:180}],
  3:[{node:1,weight:330},{node:2,weight:180},{node:4,weight:500}],
  4:[{node:3,weight:500},{node:5,weight:800}],
  5:[{node:4,weight:800}]
};

// edges for drawing
const edges=[
  {from:0,to:1,dist:150},
  {from:0,to:2,dist:210},
  {from:1,to:3,dist:330},
  {from:2,to:3,dist:180},
  {from:3,to:4,dist:500},
  {from:4,to:5,dist:800}
];

let routeLine=null;

// draw city nodes
for(let name in cities){
  let city=cities[name];

  L.circleMarker(city.coords,{
    radius:8,
    color:"blue",
    fillColor:"blue",
    fillOpacity:1
  }).addTo(map);

  L.marker(city.coords,{
    icon:L.divIcon({
      className:'city-label',
      html:`<b>${name}</b>`,
      iconSize:[100,20]
    })
  }).addTo(map);

}

// draw edges
edges.forEach(edge=>{
  const fromCoord=Object.values(cities).find(c=>c.id===edge.from).coords;
  const toCoord=Object.values(cities).find(c=>c.id===edge.to).coords;

  L.polyline([fromCoord,toCoord],{
    color:"gray",
    weight:2
  }).addTo(map);

  const midLat=(fromCoord[0]+toCoord[0])/2;
  const midLng=(fromCoord[1]+toCoord[1])/2;

  L.marker([midLat,midLng],{
    icon:L.divIcon({
      className:'distance-label',
      html:`${edge.dist} km`,
      iconSize:[60,20]
    })
  }).addTo(map);

});

// Dijkstra algorithm
function dijkstra(start,end){
  let dist=Array(6).fill(Infinity);
  let parent=Array(6).fill(null);
  let visited=new Set();

  dist[start]=0;

  while(visited.size<6){
    let u=-1;

    for(let i=0;i<6;i++){
      if(!visited.has(i) && (u===-1 || dist[i]<dist[u]))
        u=i;
    }

    visited.add(u);

    for(let edge of graph[u]){
      let v=edge.node;
      let weight=edge.weight;

      if(dist[u]+weight<dist[v]){
        dist[v]=dist[u]+weight;
        parent[v]=u;
      }
    }
  }

  let path=[];

  for(let v=end;v!==null;v=parent[v])
    path.push(v);

  return path.reverse();

}

// find route
function findRoute(){
  const startName=document.getElementById("start").value.toLowerCase();
  const endName=document.getElementById("end").value.toLowerCase();

  if(!cities[startName] || !cities[endName]){
    alert("City not found");
    return;
  }

  const start=cities[startName].id;
  const end=cities[endName].id;

  const path=dijkstra(start,end);

  let coords=[];

  path.forEach(id=>{
    let city=Object.values(cities).find(c=>c.id===id);
    coords.push(city.coords);
  });

  if(routeLine){
    map.removeLayer(routeLine);
  }

  routeLine=L.polyline(coords,{
    color:"red",
    weight:5
  }).addTo(map);

}