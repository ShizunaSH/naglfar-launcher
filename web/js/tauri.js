export const TAURI = window.__TAURI__ || null;

export function hasCore(){ return !!(TAURI && TAURI.core); }

export function invoke(cmd, args){
  return hasCore() ? TAURI.core.invoke(cmd, args) : Promise.reject('web');
}

export function listen(evt, cb){
  return (TAURI && TAURI.event) ? TAURI.event.listen(evt, cb) : Promise.resolve(null);
}

export function currentWindow(){
  return (TAURI && TAURI.window) ? TAURI.window.getCurrentWindow() : null;
}

export async function askDialog(message, opts){
  if(TAURI && TAURI.dialog && TAURI.dialog.ask){
    try{ return await TAURI.dialog.ask(message, opts); }catch(e){ return false; }
  }
  return false;
}
