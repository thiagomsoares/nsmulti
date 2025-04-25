'use strict';

function init(app, env, ctx) {
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
  
  console.log('Suporte multi-paciente configurado com sucesso');
}

module.exports = init;
