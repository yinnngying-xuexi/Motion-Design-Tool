import { createProceduralLightShaders } from "@/generators/proceduralLightShaders";

/** Original procedural textures: no external images, shader libraries or runtime dependencies. */
const common = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_phase;
uniform vec3 u_color;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
float fbm(vec2 p){float v=0.0,a=0.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p+4.7;a*=0.5;}return v;}
float gauss(float d,float w){return exp(-d*d/(w*w));}
void outputLight(vec3 energy){vec3 c=1.0-exp(-max(energy,0.0));float a=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c/max(a,0.0001),a);}
`;

export const lightShaders: Record<string, string> = {
  ...createProceduralLightShaders(common),
  "light-plasma-ring": common + `
void main(){
  vec2 p=(gl_FragCoord.xy*2.0-u_resolution)/min(u_resolution.x,u_resolution.y);
  float t=u_phase;float r=length(p);float a=atan(p.y,p.x);
  vec2 orbit=vec2(cos(a),sin(a));vec2 drift=vec2(cos(t),sin(t));
  float n=fbm(orbit*5.0+drift*1.2);
  float radius=0.643+0.028*sin(a*4.0+t+n*3.0)+0.012*sin(a*9.0-t*2.0)+0.002*sin(a*18.0+t);
  float d=r-radius;
  float hot=0.25+0.9*pow(0.5+0.5*sin(a*3.0-t*2.0+n*5.0),2.0);
  float aa=1.0/min(u_resolution.x,u_resolution.y);
  vec3 energy=u_color*(gauss(d,0.052)*0.8+gauss(d,0.12)*0.18)*hot;
  energy+=u_color*gauss(d,0.015)*1.7*hot;
  energy+=mix(u_color,vec3(1.0),0.82)*gauss(d,max(0.0033,aa))*3.4*hot;
  energy+=mix(u_color,vec3(1.0),0.9)*gauss(d,0.006)*pow(hot/1.15,4.0)*1.5;
  // Short, tapering filaments peel inward instead of rotating a rigid outline.
  for(int i=0;i<7;i++){
    float k=float(i);float angle=a+0.23*sin(t+k);
    float filament=0.60-k*0.016+0.058*sin(angle*2.0+t+k*1.8)+0.028*sin(angle*5.0-t*2.0+k);
    float strand=r-filament;
    float section=pow(0.5+0.5*sin(angle*2.0+t+k*2.1),7.0);
    float texture=0.35+0.65*fbm(p*13.0+drift+k);
    energy+=u_color*section*texture*(gauss(strand,0.018)*0.3+gauss(strand,max(aa,0.002))*0.85);
  }
  vec2 warp=vec2(fbm(p*4.0+drift),fbm(p*4.0-drift+7.2));
  float smoke=pow(fbm(p*12.0+warp*3.0+drift),3.0);
  energy+=u_color*smoke*0.37*smoothstep(0.27,0.51,r)*(1.0-smoothstep(0.58,0.72,r));
  energy*=1.0-smoothstep(0.87,0.99,r);
  outputLight(energy);
}`,
  "light-silk-wave": common + `
uniform float u_curvature;
uniform float u_waveCount;
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;float x=uv.x;float y=(uv.y-0.5)*2.0;float t=u_phase;
  float envelope=pow(max(sin(3.14159265*x),0.0),0.7);
  vec3 energy=vec3(0.0);
  float pixel=2.0/u_resolution.y;
  // Long, overlapping folds with independent phases and a traveling crest.
  // The requested count controls spatial rhythm, not duplicated rigid sine lines.
  for(int i=0;i<5;i++){
    float k=float(i);float phase=k*0.92-t;
    float frequency=u_waveCount+(k-2.0)*0.18;
    float bend=x*6.2831853*frequency+phase+0.65*sin(x*4.5+t+k);
    float localBend=0.56+0.44*gauss(x-(0.38+0.17*sin(t+k)),0.31);
    float center=(0.38+0.08*sin(t+k*0.8))*sin(bend)*localBend;
    center+=0.14*sin(x*6.2831853+t+k*1.2)+(k-2.0)*0.018*envelope;
    center*=u_curvature*(0.72+0.28*envelope);
    float d=y-center;
    float width=(0.22+0.026*k)*envelope*(0.72+0.28*sin(x*5.0-t+k))+0.002;
    float texture=0.65+0.35*fbm(vec2(x*14.0+cos(t+k),d*20.0+sin(t+k)));
    // Feather the film itself, independently of the crisp luminous upper edge.
    float feather=max(pixel*0.9,width*0.18);
    float surface=smoothstep(-width-feather,-width+feather,d)*(1.0-smoothstep(-feather,feather,d));
    float filmProfile=gauss(d+width*0.46,width*0.38);
    float fold=surface*filmProfile*0.17;
    // Fine woven dots follow the surface, rather than filling the canvas with particles.
    vec2 cell=fract(vec2(x*u_resolution.x/3.2+0.8*sin(t+k),-d/width*11.0+x*5.0))-0.5;
    float weave=exp(-dot(cell,cell)*54.0)*surface*filmProfile*0.022;
    float edge=(1.0-smoothstep(0.0015,0.0015+pixel*0.65,abs(d)))*1.3;
    float lowerEdge=gauss(d+width,max(width*0.13,pixel*0.8))*0.018;
    float glow=gauss(d,0.015)*0.18;
    float gleam=0.28+0.72*exp(-pow((x-(0.52+0.2*sin(t+k)))/0.32,2.0));
    vec3 tint=mix(u_color*vec3(0.24,0.47,1.0),u_color,0.55+0.45*sin(x*3.0-t+k));
    float layerWeight=exp(-k*0.7);
    float foldVisibility=0.12+0.88*gauss(x-(0.38+0.18*sin(t+k*1.4)),0.28+0.035*k);
    energy+=tint*(fold*texture+weave+(lowerEdge+glow+edge*gleam)*foldVisibility)*envelope*layerWeight;
    energy+=mix(u_color,vec3(1.0),0.18)*edge*gleam*0.14*envelope*layerWeight*foldVisibility;
  }
  energy*=smoothstep(0.005,0.09,x)*(1.0-smoothstep(0.94,0.995,x));
  energy*=1.0-smoothstep(0.8,1.0,abs(y));
  outputLight(energy*3.4);
}`
};
