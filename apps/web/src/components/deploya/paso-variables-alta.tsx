"use client";

import React, { useState } from 'react';
import { Lock, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface VariableForm {
  id: string;
  clave: string;
  valor: string;
  visible: boolean;
}

interface PasoVariablesProps {
  variablesIniciales?: { clave: string; valor: string }[];
  onSiguiente: (variables: { clave: string; valor: string }[]) => void;
  onAtras: () => void;
}

export const PasoVariablesAlta: React.FC<PasoVariablesProps> = ({
  variablesIniciales = [],
  onSiguiente,
  onAtras,
}) => {
  const [variables, setVariables] = useState<VariableForm[]>(
    variablesIniciales.length > 0
      ? variablesIniciales.map((v, index) => ({ id: String(index), ...v, visible: false }))
      : []
  );

  const agregarVariable = () => {
    setVariables([...variables, { id: Date.now().toString(), clave: '', valor: '', visible: false }]);
  };

  const eliminarVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
  };

  const actualizarVariable = (id: string, campo: 'clave' | 'valor', valor: string) => {
    setVariables(
      variables.map((v) => {
        if (v.id === id) {
          const valorProcesado = campo === 'clave' ? valor.toUpperCase().replace(/[^A-Z0-9_]/g, '') : valor;
          return { ...v, [campo]: valorProcesado };
        }
        return v;
      })
    );
  };

  const toggleVisibilidad = (id: string) => {
    setVariables(
      variables.map((v) => (v.id === id ? { ...v, visible: !v.visible } : v))
    );
  };

  const manejarContinuar = () => {
    const variablesValidas = variables
      .filter((v) => v.clave.trim() !== '')
      .map(({ clave, valor }) => ({ clave, valor }));
    onSiguiente(variablesValidas);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Cabecera de la sección */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Variables de entorno</h2>
        <p className="text-sm text-gray-500 mt-1">
          Se guardan cifradas y se pasan al contenedor al arrancar. Este paso es opcional.
        </p>
      </div>

      {/* Listado de variables */}
      <div className="space-y-3 mb-6">
        {variables.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-400">No hay variables de entorno añadidas.</p>
          </div>
        ) : (
          variables.map((variable) => (
            <div key={variable.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="CLAVE (ej. DATABASE_URL)"
                  value={variable.clave}
                  onChange={(e) => actualizarVariable(variable.id, 'clave', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-mono uppercase"
                />
              </div>
              <div className="flex-1 relative">
                <input
                  type={variable.visible ? 'text' : 'password'}
                  placeholder="Valor"
                  value={variable.valor}
                  onChange={(e) => actualizarVariable(variable.id, 'valor', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibilidad(variable.id)}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {variable.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => eliminarVariable(variable.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Eliminar variable"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Botón de añadir y nota informativa */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pt-2">
        <button
          type="button"
          onClick={agregarVariable}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Plus size={16} />
          Añadir variable
        </button>

        <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Lock size={14} className="text-gray-400" />
          <span>Cifradas en la base de datos</span>
        </div>
      </div>

      {/* Acciones de navegación */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onAtras}
          className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={manejarContinuar}
          className="px-6 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};