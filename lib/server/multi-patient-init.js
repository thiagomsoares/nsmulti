'use strict';

function init(app, env, ctx) {
  // Verifica se ctx.store e ctx.store.collection existem
  if (!ctx.store || !ctx.store.collection) {
    console.error('ERRO: ctx.store ou ctx.store.collection está indefinido! Verifique a conexão com o MongoDB.');
    return;
  }

  // Adiciona middleware para adicionar patientId a novos documentos
  ctx.store.collection.beforeSave = function(doc, collection) {
    // Se a requisição tiver um patientId e o documento não tiver, adiciona
    if (ctx.req && ctx.req.patientId && !doc.patientId) {
      doc.patientId = ctx.req.patientId;
    }
    
    return doc;
  };
  
  // Adiciona middleware para filtrar documentos por patientId
  ctx.store.collection.beforeFind = function(query, collection) {
    // Se a requisição tiver um patientId e a consulta não tiver, adiciona
    if (ctx.req && ctx.req.patientId && !query.patientId) {
      query.patientId = ctx.req.patientId;
    }
    
    return query;
  };
}

module.exports = init;
