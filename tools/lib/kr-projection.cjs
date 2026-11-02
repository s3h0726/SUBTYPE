'use strict';
// 대구 공식 WFS의 EPSG:5187 역투영. 정의: https://epsg.io/5187.proj4
// GRS80, 원점 위도 38도·경도 129도, 가산 좌표 200000m·600000m.
function epsg5187(x,y){
 const a=6378137,f=1/298.257222101,e=2*f-f*f,ep=e/(1-e),rad=Math.PI/180;
 const meridian=p=>a*((1-e/4-3*e*e/64-5*e**3/256)*p-(3*e/8+3*e*e/32+45*e**3/1024)*Math.sin(2*p)+(15*e*e/256+45*e**3/1024)*Math.sin(4*p)-35*e**3/3072*Math.sin(6*p));
 const m=meridian(38*rad)+Number(y)-600000,mu=m/(a*(1-e/4-3*e*e/64-5*e**3/256)),u=(1-Math.sqrt(1-e))/(1+Math.sqrt(1-e));
 const p=mu+(3*u/2-27*u**3/32)*Math.sin(2*mu)+(21*u*u/16-55*u**4/32)*Math.sin(4*mu)+151*u**3/96*Math.sin(6*mu)+1097*u**4/512*Math.sin(8*mu);
 const sin=Math.sin(p),cos=Math.cos(p),tan=Math.tan(p),n=a/Math.sqrt(1-e*sin*sin),r=a*(1-e)/(1-e*sin*sin)**1.5,t=tan*tan,c=ep*cos*cos,d=(Number(x)-200000)/n;
 const lat=p-n*tan/r*(d*d/2-(5+3*t+10*c-4*c*c-9*ep)*d**4/24+(61+90*t+298*c+45*t*t-252*ep-3*c*c)*d**6/720);
 const lon=129*rad+(d-(1+2*t+c)*d**3/6+(5-2*c+28*t-3*c*c+8*ep+24*t*t)*d**5/120)/cos;
 return[lat/rad,lon/rad];
}
module.exports={epsg5187};
