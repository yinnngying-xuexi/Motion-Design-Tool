/** Three light heads share a closed conveyor path measured from the reference.
 * Numbers describe a small analytic motion curve, not image pixels or frame footage. */
export function createFlareLightShader(common: string): string {
  return common + `
uniform float u_glowSpread;
vec2 flareCurve(float u,vec2 a,vec2 b,vec2 va,vec2 vb,float span){
  float u2=u*u,u3=u2*u;
  return (2.0*u3-3.0*u2+1.0)*a+(u3-2.0*u2+u)*va*span
       +(-2.0*u3+3.0*u2)*b+(u3-u2)*vb*span;
}
vec2 flarePath(float frame){
  float q=mod(frame,90.0);vec2 p;
  if(q<76.0){p=vec2(330.0+q*130.0/76.0,0.0);}
  else{
    float r=q-76.0;
    if(r<3.0)p=flareCurve(r/3.0,vec2(460.0,0.0),vec2(439.2,36.3),vec2(-2.0,6.0),vec2(-17.85,17.8),3.0);
    else if(r<5.0)p=flareCurve((r-3.0)/2.0,vec2(439.2,36.3),vec2(374.2,61.6),vec2(-17.85,17.8),vec2(-34.15,-4.7),2.0);
    else if(r<7.0)p=flareCurve((r-5.0)/2.0,vec2(374.2,61.6),vec2(335.4,30.8),vec2(-34.15,-4.7),vec2(-6.6,-13.9),2.0);
    else if(r<10.0)p=flareCurve((r-7.0)/3.0,vec2(335.4,30.8),vec2(331.0,6.5),vec2(-6.6,-13.9),vec2(-.75,-3.85),3.0);
    else p=flareCurve((r-10.0)/4.0,vec2(331.0,6.5),vec2(330.0,0.0),vec2(-.75,-3.85),vec2(130.0/76.0,0.0),4.0);
  }
  return (p-vec2(395.0,0.0))*vec2(.72,-.72);
}
float flareSegmentDistance(vec2 p,vec2 a,vec2 b){
  vec2 delta=b-a;
  float u=clamp(dot(p-a,delta)/max(dot(delta,delta),.0001),0.0,1.0);
  return length(p-a-delta*u);
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  vec2 p=(uv-.5)*vec2(736.0,145.0);
  float t=u_phase,aa=max(.45,145.0/u_resolution.y*.6);
  float spread=max(.05,u_glowSpread);
  float edgeFade=smoothstep(0.0,.08,uv.y)*(1.0-smoothstep(.92,1.0,uv.y));
  float body=1.0-smoothstep(98.0,136.0,abs(p.x));
  float hotLine=exp(-pow(abs(p.x)/85.0,4.0));
  float extension=pow(max(0.0,1.0-abs(p.x)/366.0),1.8);
  // A thin pale core, narrow colored bloom and very quiet long extensions.
  vec3 haloTint=mix(u_color,u_color.brg,.23);
  vec3 energy=mix(u_color,vec3(1.0),.7)*gauss(p.y,aa)*hotLine*6.0;
  energy+=u_color*gauss(p.y,aa)*body*2.4;
  energy+=u_color*gauss(p.y,2.1)*body*.4;
  energy+=u_color*gauss(p.y,aa)*extension*.18;
  energy+=haloTint*gauss(p.y,29.0*spread)*gauss(p.x,95.0*spread)*.35*u_glowSpread*edgeFade;
  float frame=t/6.2831853*150.0+7.3;
  for(int i=0;i<3;i++){
    float q=mod(frame+float(i)*30.0,90.0);
    vec2 head=flarePath(q),d=p-head;
    float shine=.88+.12*cos(t*3.0+head.x*.04);
    float onLine=1.0-smoothstep(.5,5.0,abs(head.y));
    // The lower return is fast: its trail grows naturally with traveled distance.
    if(q>76.0){
      float envelope=smoothstep(76.0,77.0,q)*(1.0-smoothstep(88.5,90.0,q));
      float trail=0.0,trailHalo=0.0;
      vec2 previous=head;
      for(int j=1;j<=28;j++){
        float age=float(j)/28.0;
        vec2 point=flarePath(q-age*4.4);
        float fade=(1.0-smoothstep(.45,1.0,age))*envelope;
        float width=mix(3.8,1.8,age);
        float distance=flareSegmentDistance(p,previous,point);
        trail=max(trail,gauss(distance,width)*fade);
        trailHalo=max(trailHalo,gauss(distance,7.0)*fade);
        previous=point;
      }
      energy+=u_color*vec3(.9,.45,1.0)*(trail*3.4+trailHalo*.16*u_glowSpread*edgeFade);
    }
    float core=gauss(length(d),3.5);
    float diamond=gauss(abs(d.x)+abs(d.y),5.2);
    float rays=gauss(d.x,.7)*gauss(d.y,7.0)+gauss(d.y,.6)*gauss(d.x,13.0);
    vec2 haloSize=mix(vec2(14.0,12.0),vec2(27.0,20.0),onLine)*spread;
    float halo=exp(-dot(d/haloSize,d/haloSize));
    energy+=haloTint*halo*mix(.5,1.05,onLine)*shine*u_glowSpread*edgeFade;
    energy+=u_color*(diamond*.8+rays*onLine*.7)*shine;
    energy+=mix(u_color,vec3(1.0),.92)*(core*6.2+diamond*onLine*.4)*shine;
  }
  // Sparse motes rise above the line rather than blinking in a stationary grid.
  for(int i=0;i<18;i++){
    float k=float(i),seed=hash(vec2(k,13.0));
    float age=fract(t/6.2831853*3.0+seed);
    vec2 point=vec2((hash(vec2(k,8.0))-.5)*128.0+4.0*sin(age*4.0+k),3.0+age*57.0);
    float radius=.45+.4*hash(vec2(k,6.0));
    float fade=pow(sin(age*3.14159265),1.5);
    energy+=mix(u_color,vec3(1.0),.35)*gauss(length(p-point),radius)*fade*1.2;
    energy+=u_color*gauss(length(p-point),radius*3.0)*fade*.035;
  }
  outputLight(energy);
}`;
}
