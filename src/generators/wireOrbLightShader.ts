/** Two broad, flowing filament ribbons over a subdued spherical wire field. */
export function createWireOrbLightShader(common: string): string {
  return `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
` + common + `
float wireFilament(float phase){
  float distance=abs(fract(phase/6.2831853+.5)-.5)*6.2831853;
  float coverage=.25;
#ifdef GL_OES_standard_derivatives
  coverage=max(.04,fwidth(phase)*.34);
#endif
  return gauss(distance,coverage)*min(1.0,1.4/max(coverage,.01));
}
void main(){
  vec2 p=(gl_FragCoord.xy*2.0-u_resolution)/min(u_resolution.x,u_resolution.y);
  float r=length(p),a=atan(p.y,p.x),t=u_phase;
  float pose=1.3*cos(t),radius=.77;
  float pixel=2.0/min(u_resolution.x,u_resolution.y);
  vec3 energy=vec3(0.0);
  if(r<radius){
    float z=sqrt(max(0.0,radius*radius-r*r));
    for(int side=0;side<2;side++){
      float back=float(side);
      vec3 q=vec3(p,z*(1.0-2.0*back))/radius;
      float turn=.1*sin(pose),lean=.13*sin(pose);
      q.xy=mat2(cos(lean),-sin(lean),sin(lean),cos(lean))*q.xy;
      q.xz=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*q.xz;
      float flow=q.x+.16*sin(q.y*3.8+q.z*2.0+pose*.3)+.055*sin(q.z*5.0-q.y*2.0);
      float line=wireFilament(flow*128.0);
      float rim=pow(clamp(r/radius,0.0,1.0),8.0);
      float depth=smoothstep(.1,.5,r/radius);
      float visible=.05+.95*smoothstep(.5,1.1,abs(pose));
      float dashed=.35+.65*pow(.5+.5*sin(q.y*125.0+q.x*15.0),3.0);
      energy+=u_color*line*depth*visible*(.055*dashed+rim*.5)*(1.0-back*.6);
    }
  }
  // The bundle remains wide along each side, tapering only near its top and bottom.
  // Width and internal folds travel continuously together; they are not isolated tips.
  float travel=2.4*cos(t);
  float side=pow(abs(cos(a)),1.35);
  float bundleWidth=.012+.23*side*(.76+.24*sin(3.0*a+travel));
  float bundleVisibility=smoothstep(.012,.07,bundleWidth);
  float along=atan(p.y,abs(p.x));
  float hand=p.x<0.0?-1.0:1.0;
  float upper=along-(.55+.27*sin(pose)*hand);
  float lower=along-(-.62+.2*sin(pose)*hand);
  float packet=gauss(upper,.13)+gauss(lower,.14);
  float kink=.22*upper/.17*gauss(upper,.17)-.22*lower/.18*gauss(lower,.18);
  for(int i=0;i<34;i++){
    float u=float(i)/33.0;
    // Advect the material independently of the slow, reversible envelope pose.
    // Integer time harmonics keep the six-second loop seamless; different strands shear slightly.
    float advection=2.0*t+.24*(sin(2.0*t+u*6.2831853)-sin(u*6.2831853));
    float phase=3.0*a+travel+u*5.0-advection;
    float folded=u+(.13*sin(phase)+.04*sin(7.0*a-travel+u*12.5663706-advection*2.0)+kink)*sin(u*3.14159265);
    float path=radius-bundleWidth*folded;
    float distance=r-path;
    float width=.0012,sigma=sqrt(width*width+pixel*pixel*.11);
    float line=gauss(distance,sigma)*width/sigma;
    float halo=gauss(distance,.009);
    float fold=pow(.5+.5*sin(phase+.7),7.0);
    float stream=pow(.5+.5*cos(2.0*a-2.0*t+u*.9),5.0);
    float edge=.18+.82*pow(abs(u*2.0-1.0),3.0);
    float light=(.2+fold*.6+packet*.8+stream*.85)*edge*bundleVisibility;
    energy+=u_color*(line+halo*.025)*light*2.4;
    energy+=mix(u_color,vec3(1.0),.35)*line*(fold*.35+packet*.3+stream*.3)*edge*bundleVisibility;
    if(i==0||i==33)energy+=mix(u_color,vec3(1.0),.45)*line*(.12+fold*.4+packet*1.2+stream*1.2)*bundleVisibility;
  }
  float hot=pow(.5+.5*sin(3.0*a+.85*sin(pose)+.2),10.0);
  energy+=u_color*gauss(r-radius,.028)*hot*.11;
  energy+=mix(u_color,vec3(1.0),.2)*gauss(r-radius,.0025)*(.22+hot*.5);
  outputLight(energy);
}`;
}
