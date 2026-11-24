// Testes locais da camada estática com respostas controladas: node testes/estatico.cjs
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const dados = new Map();
const localStorage = { getItem: k => dados.has(k) ? dados.get(k) : null, setItem: (k,v) => dados.set(k,String(v)) };
let chamadas = 0;
const respostas = {
 'pokemon?limit=20&offset=0': {count: 21,results:[{name:'bulbasaur',url:'https://pokeapi.co/api/v2/pokemon/1/'}]},
 'pokemon/pikachu': {id:25,name:'pikachu'},
 'pokemon/25': {id:25,name:'pikachu',species:{name:'pikachu'},sprites:{front_default:'sprite'}},
 'type/fire': {pokemon:[{pokemon:{name:'charmander',url:'https://pokeapi.co/api/v2/pokemon/4/'}}]},
 'pokemon-species/eevee': {evolution_chain:{url:'https://pokeapi.co/api/v2/evolution-chain/67/'}},
 'evolution-chain/67': {chain:{species:{name:'eevee'},evolves_to:[{species:{name:'vaporeon'}},{species:{name:'jolteon'}}]}},
 'item/1': {id:1,name:'master-ball',names:[{name:'Master Ball',language:{name:'en'}}],category:{name:'balls'},sprites:{default:'imagem'},effect_entries:[{short_effect:'Efeito',language:{name:'pt'}}],flavor_text_entries:[],prices:[]},
 'item-category/balls': {name:'balls',names:[{name:'Balls',language:{name:'en'}}],pocket:{name:'pokeballs'}},
 'item-pocket/pokeballs': {names:[{name:'Poké Balls',language:{name:'en'}}]},
};
const contexto = vm.createContext({URL, URLSearchParams, AbortController, setTimeout, clearTimeout, localStorage, fetch: async url => { chamadas++; const key = url.replace('https://pokeapi.co/api/v2/',''); return {ok:!!respostas[key],status:404,json:async()=>respostas[key]}; }});
vm.runInContext(fs.readFileSync('js/pesquisa.js','utf8'),contexto);
const api = (c,o) => contexto.consultarApi(c,o);
(async()=>{
 assert.equal((await api('/pokemons?inicio=0')).pokemons[0].name,'bulbasaur');
 assert.equal((await api('/pokemons?tipo=fire')).pokemons[0].id,4);
 const antes=chamadas; await Promise.all([api('/pokemon/25'),api('/pokemon/25')]); assert.equal(chamadas,antes+1);
 assert.equal((await api('/pesquisa?nome=PIKACHU')).id,25);
 assert.equal((await api('/evolucoes/eevee')).evolves_to.length,2);
 assert.equal((await api('/itens/1')).descricao,'Efeito');
 assert.deepEqual(Array.from(contexto.lerFavoritosLocais()), []);
 contexto.adicionarFavoritoLocal(25);
 assert.equal(dados.get('pokedex-favoritos-v1'), '[25]');
 assert.deepEqual(Array.from(contexto.lerFavoritosLocais()), [25]);
 assert.throws(() => contexto.adicionarFavoritoLocal(25));
 for (const id of [1,2,3,4]) contexto.adicionarFavoritoLocal(id);
 assert.throws(() => contexto.adicionarFavoritoLocal(5));
 contexto.removerFavoritoLocal(25);
 assert.deepEqual(Array.from(contexto.lerFavoritosLocais()), [1,2,3,4]);
 dados.set('pokedex-favoritos-v1', JSON.stringify([{id:96,nome:'drowzee'},{id:89,nome:'muk'},{id:96,nome:'drowzee'}]));
 assert.deepEqual(Array.from(contexto.lerFavoritosLocais()), [96,89]);
 assert.equal(dados.get('pokedex-favoritos-v1'), '[96,89]');
 dados.delete('pokedex-favoritos-v1');
 dados.set('favoritos', '[25,25,1]');
 assert.deepEqual(Array.from(contexto.lerFavoritosLocais()), [25,1]);
 assert.equal(dados.get('pokedex-favoritos-v1'), '[25,1]');
 dados.set('pokedex-favoritos-v1','{');
 assert.deepEqual(Array.from(contexto.lerFavoritosLocais()), []);
 assert.equal(dados.get('pokedex-favoritos-v1'),'{');
 dados.set('pokedex-favoritos-v1', 'null');
 assert.deepEqual(Array.from(contexto.lerFavoritosLocais()), []);
 console.log('Testes da camada estática passaram.');
})().catch(e=>{console.error(e);process.exitCode=1});
