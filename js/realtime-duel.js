// Friendly two-player progress stream for a private Supabase Realtime channel.
// Supabase JS v2 client must be provided by the caller; never uses a service-role key.
// Not connected to public rankings. Incoming progress is UNTRUSTED demonstration data.
const ROOM=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function createFriendlyDuel({client,roomId,join=false,onProgress=()=>{},onStatus=()=>{}}){
 if(!client||!ROOM.test(roomId))throw Error('Supabase client and UUID roomId required');
 const {data:{user},error:userError}=await client.auth.getUser();
 if(userError||!user)throw Error('Log in before joining a friendly match');
 if(join){
  const {data,error}=await client.rpc('subtype_join_duel',{p_room:roomId});
  if(error||!data)throw Error('Room unavailable, full or expired');
 }
 const {data:room,error:roomError}=await client.from('subtype_duel_rooms')
  .select('id,host_id,guest_id,route_id,service_key,status').eq('id',roomId).single();
 if(roomError||!room)throw Error('You are not a member of this room');
 const {data:{session}}=await client.auth.getSession();
 if(!session?.access_token)throw Error('Valid session required');
 await client.realtime.setAuth(session.access_token);
 let subscribed=false,lastSent=0,closed=false;
 const channel=client.channel('subtype-duel:'+roomId,{config:{private:true}});
 channel.on('broadcast',{event:'progress'},message=>{
  const p=message?.payload||{};
  if(!ROOM.test(roomId)||p.userId===user.id)return;
  if(!Number.isInteger(p.completed)||p.completed<0||p.completed>100000)return;
  if(!Number.isInteger(p.total)||p.total<2||p.total>100000||p.completed>p.total)return;
  onProgress({userId:String(p.userId||''),completed:p.completed,total:p.total});
 });
 channel.subscribe((status,error)=>{subscribed=status==='SUBSCRIBED';onStatus({status,error:error?.message||null})});
 return {
  room,
  async sendProgress(completed,total){
   if(closed||!subscribed)return false;
   if(!Number.isInteger(completed)||!Number.isInteger(total)||total<2||total>100000||completed<0||completed>total)throw Error('Invalid progress');
   if(Date.now()-lastSent<150)return false;
   lastSent=Date.now();
   const result=await channel.send({type:'broadcast',event:'progress',payload:{userId:user.id,completed,total}});
   return result==='ok';
  },
  async close(){if(closed)return;closed=true;await client.removeChannel(channel)}
 };
}
// CAUTION: A room member can spoof client-sent progress; do not use it to award rankings.
