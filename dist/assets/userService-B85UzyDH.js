import{o as u,s as l,ae as y}from"./index-gPhEw2gI.js";import{createAuthUser as _}from"./authUserService-Bvs1d5Bw.js";async function E(t,e){try{return await t()}catch(r){throw console.error("Supabase operation error:",r),r}}async function f(t,e,r,a){try{if(u(),!t)return{success:!1,error:"Email address is required"};const c="https://ahnpjmdfutxdiotrbtzc.supabase.co",s=void 0;if(!s||s==="placeholder-service-key"){const d=`${window.location.origin}/reset-password`,{error:o}=await l.auth.resetPasswordForEmail(t,{redirectTo:d,data:{employee_id:e,full_name:r,email_type:"welcome"}});return o?(console.error("Error sending welcome email:",o),{success:!1,error:o.message||"Failed to send welcome email"}):{success:!0}}const n=`${window.location.origin}/reset-password`,{error:i}=await l.auth.resetPasswordForEmail(t,{redirectTo:n,data:{employee_id:e,full_name:r,email_type:"welcome",temporary_password:a}});return i?(console.error("Error sending welcome email:",i),{success:!1,error:i.message||"Failed to send welcome email"}):(console.log(`[ADMIN] User credentials for ${r} (${e}):`),console.log(`  Email: ${t}`),console.log(`  Temporary Password: ${a}`),console.log("  Note: Password reset link sent to email. Admin should share password securely."),{success:!0})}catch(c){return console.error("Error in sendWelcomeEmail:",c),{success:!1,error:c instanceof Error?c.message:"Unknown error sending email"}}}async function I(t={}){const{page:e=1,pageSize:r=y,search:a="",filters:c=[],sort:s,hospitalId:n,departmentId:i,status:d}=t;return E(async()=>{let o=l.from("users").select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*)
        `,{count:"exact"});n&&(o=o.eq("hospital_id",n)),i&&(o=o.eq("department_id",i)),d&&(o=o.eq("status",d)),a&&(o=o.or(`full_name.ilike.%${a}%,employee_id.ilike.%${a}%,email.ilike.%${a}%`)),s?o=o.order(s.key,{ascending:s.direction==="asc"}):o=o.order("created_at",{ascending:!1});const m=(e-1)*r,w=m+r-1;o=o.range(m,w);const{data:g,error:p,count:h}=await o;if(p)throw p;return{data:g||[],total:h||0,page:e,pageSize:r,totalPages:Math.ceil((h||0)/r)}})}async function $(t){try{if(u()){const{data:e,error:r}=await l.from("users").select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*),
          emergency_contacts:emergency_contacts(*)
        `).eq("id",t).maybeSingle();if(r)throw r;return e}}catch(e){throw console.error("Error fetching user:",e),e}}function b(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZ",e="abcdefghijklmnopqrstuvwxyz",r="0123456789",a="!@#$%^&*",c=t+e+r+a;let s="";s+=t[Math.floor(Math.random()*t.length)],s+=e[Math.floor(Math.random()*e.length)],s+=r[Math.floor(Math.random()*r.length)],s+=a[Math.floor(Math.random()*a.length)];for(let n=s.length;n<12;n++)s+=c[Math.floor(Math.random()*c.length)];return s.split("").sort(()=>Math.random()-.5).join("")}async function D(t){try{if(u()){const{data:e,error:r}=await l.from("users").insert(t).select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*)
        `).maybeSingle();if(r)throw r;if(e.email){const a=b(),{success:c,error:s,authUserId:n}=await _(e.email,a,e.id);if(!c)throw console.error("Failed to create Auth user:",s),await l.from("users").delete().eq("id",e.id),new Error(`Failed to create authentication account: ${s||"Unknown error"}`);if(n&&n!==e.id){const{data:i,error:d}=await l.from("users").update({id:n}).eq("id",e.id).select(`
              *,
              role:roles!role_id(*),
              department:departments!department_id(*),
              hospital:hospitals!hospital_id(*)
            `).maybeSingle();if(d)console.error("Failed to update user ID:",d);else if(i){const o=await f(e.email,e.employee_id,e.full_name);return o.success||console.error("Failed to send welcome email:",o.error),i}}else{const i=await f(e.email,e.employee_id,e.full_name);i.success||console.error("Failed to send welcome email:",i.error)}}return e}}catch(e){throw console.error("Error creating user:",e),e}}async function P(t,e){try{if(u()){const{data:r,error:a}=await l.from("users").update({...e,updated_at:new Date().toISOString()}).eq("id",t).select(`
          *,
          role:roles!role_id(*),
          department:departments!department_id(*),
          hospital:hospitals!hospital_id(*)
        `).maybeSingle();if(a)throw a;return r}}catch(r){throw console.error("Error updating user:",r),r}}async function A(t){try{if(u()){const{error:e}=await l.from("users").delete().eq("id",t);if(e)throw e}}catch(e){throw console.error("Error deleting user:",e),e}}async function T(t,e){try{if(u()){const{error:r}=await l.from("users").update({status:e,updated_at:new Date().toISOString()}).in("id",t);if(r)throw r}}catch(r){throw console.error("Error bulk updating users:",r),r}}async function x(t){try{if(u()){const{error:e}=await l.from("users").delete().in("id",t);if(e)throw e}}catch(e){throw console.error("Error bulk deleting users:",e),e}}export{T as a,x as b,D as c,$ as d,A as e,I as g,P as u};
