import { createFlareLightShader } from "@/generators/flareLightShader";
import { createWireOrbLightShader } from "@/generators/wireOrbLightShader";

/** Analytic light fields: no textures, frame atlases, image decoding or external assets. */
export function createProceduralLightShaders(common: string): Record<string, string> {
  return {
    "light-particle-band": common + `
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  vec2 p=uv*vec2(420.0,60.0);
  float cell=floor(p.x/6.0);vec3 energy=vec3(0.0);
  for(int i=-2;i<=2;i++){
    float k=cell+float(i),seed=hash(vec2(k,7.0));
    vec2 center=vec2(k*6.0+1.0+4.0*seed,30.0+(hash(vec2(k,3.0))-.5)*1.1);
    center.x+=.35*sin(u_phase+seed*6.2831853);
    vec2 d=p-center;float radius=.38+.8*pow(seed,2.0);
    float pulse=.16+.84*pow(.5+.5*sin(u_phase*(1.0+floor(seed*3.0))+seed*45.0),3.0);
    float body=exp(-dot(d,d)/(radius*radius*2.0));
    float glow=exp(-dot(d/vec2(4.2,2.5),d/vec2(4.2,2.5)))*.16;
    energy+=u_color*(body*2.2+glow)*pulse;
    energy+=mix(u_color,vec3(1.0),.65)*body*pow(pulse,4.0)*.7;
  }
  energy*=smoothstep(0.0,.07,uv.x)*(1.0-smoothstep(.92,1.0,uv.x));
  outputLight(energy);
}`,
    "light-electric-beam": common + `
float jag(float x,float t,float seed){
  float cell=floor(x);vec2 drift=vec2(cos(t),sin(t))*1.8;
  return mix(noise(vec2(cell*.87+seed,4.0)+drift),noise(vec2((cell+1.0)*.87+seed,4.0)+drift),fract(x))-.5;
}
float arc(float x,float t,float seed){
  vec2 drift=vec2(cos(t),sin(t));
  float fine=jag(x*120.0,t,seed);
  float medium=jag(x*35.0,t,seed+8.1);
  float coarse=noise(vec2(x*11.0+seed,4.7)+drift)-.5;
  return fine*.018+medium*.057+coarse*.046;
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;float y=uv.y-.5;float x=uv.x,t=u_phase;
  float aa=.7/u_resolution.y;float center=arc(x,t,0.0);
  float pulse=.78+.22*sin(t*7.0+x*14.0);
  float edge=smoothstep(.015,.1,x)*(1.0-smoothstep(.9,.99,x));
  float d=y-center;vec3 energy=u_color*(gauss(d,.032)*.32+gauss(d,.008)*1.25)*pulse;
  energy+=mix(u_color,vec3(1.0),.82)*gauss(d,max(aa,.0018))*3.0*pulse;
  for(int i=0;i<3;i++){
    float k=float(i),start=.14+k*.24+.045*sin(t+k*2.0);
    float q=(x-start)/.2;float window=smoothstep(0.0,.1,q)*(1.0-smoothstep(.65,1.0,q));
    float fork=arc(x,t,k*12.0+15.0)+sin(clamp(q,0.0,1.0)*3.14159265)*(.018+.009*k)*sin(t*2.0+k);
    float fd=y-fork;
    energy+=u_color*(gauss(fd,.008)*.38+gauss(fd,max(aa,.0011))*.85)*window;
  }
  energy+=u_color*gauss(y,.065)*.035*(.7+.3*sin(t*3.0+x*22.0));
  outputLight(energy*edge);
}`,
    "loading-reference-dot-wave": common + `
// A single perspective loop: the second-harmonic bend travels around it twice
// per 1.48s cycle, alternating a bowl, crossed lobes and an inverted bowl.
vec3 dotWavePosition(float angle,float phase){
  float depth=sin(angle),bend=cos(2.0*angle+phase);
  float perspective=1.0-.144*depth+.0247*bend;
  float x=-3.99+(66.46*cos(angle)+1.72*depth*sin(phase))/perspective;
  float y=1.73-(4.105*depth-13.02*bend)/perspective;
  return vec3(x,y,depth);
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution,p=(uv-.5)*vec2(168.0,76.0);
  vec3 energy=vec3(0.0);float phase=u_phase*2.0+.0074;
  float aa=76.0/u_resolution.y*.6;
  for(int i=0;i<53;i++){
    float angle=(float(i)+.75)/53.0*6.2831853;
    vec3 point=dotWavePosition(angle,phase);
    vec2 delta=p-point.xy;
    float depth=point.z*.5+.5;
    float radius=mix(.62,1.87,pow(depth,1.15));
    float variance=radius*radius+aa*aa*.35;
    float core=exp(-dot(delta,delta)/variance)*radius*radius/variance;
    float halo=gauss(length(delta),radius*1.8);
    float visibility=.28+.72*smoothstep(-.7,.4,point.z);
    energy+=u_color*(core*2.15+halo*.028)*visibility;
    energy+=mix(u_color,vec3(1.0),.78)*core*.9*visibility;
  }
  outputLight(energy);
}`,
    "loading-reference-wire-orb": createWireOrbLightShader(common),
    "loading-reference-particle-ring": common + `
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  vec2 p=(uv-.5)*2.0;float r=length(p),a=atan(p.y,p.x),t=u_phase;
  float d=r-.77;
  float head=pow(max(0.0,cos(a-t)),28.0);
  vec3 energy=u_color*(gauss(d,.064)*.38+gauss(d,.022)*1.68+gauss(r-.813,.01)*.09);
  energy+=mix(u_color,vec3(1.0),.32)*gauss(d,.008)*.72;
  energy+=u_color*gauss(d,.034)*head*1.1;
  // Small independent orbiting points replace the old radial hatching.
  float orbit=(a+t*.42+3.14159265)/6.2831853*64.0;
  float particleLight=0.0;
  for(int i=-1;i<=1;i++){
    float cell=floor(orbit)+float(i),seed=hash(vec2(mod(cell,64.0),19.0));
    float angle=(cell+.5+(seed-.5)*.36)/64.0*6.2831853-t*.42-3.14159265;
    float distanceToPoint=length(p-vec2(cos(angle),sin(angle))*(.844+(seed-.5)*.032));
    float pulse=.42+.58*pow(.5+.5*sin(t*2.0+seed*18.0),3.0);
    particleLight+=gauss(distanceToPoint,.008)*step(.64,seed)*pulse;
  }
  energy+=u_color*particleLight*.65;
  vec2 innerGrid=uv*80.0;vec2 innerCell=floor(innerGrid);vec2 point=fract(innerGrid)-.5;
  point-=vec2(sin(t+hash(innerCell)*23.0),cos(t+hash(innerCell)*17.0))*.23;
  float spark=exp(-dot(point,point)*150.0)*step(.94,hash(innerCell));
  float twinkle=pow(.5+.5*sin(t*(1.0+floor(hash(innerCell)*3.0))+hash(innerCell)*50.0),5.0);
  float lowHalf=1.0-smoothstep(.1,.6,p.y);
  energy+=u_color*spark*twinkle*lowHalf*smoothstep(.22,.66,r)*(1.0-smoothstep(.7,.77,r))*2.2;
  outputLight(energy);
}`,
    "loading-reference-flare-line": createFlareLightShader(common)
  };
}
