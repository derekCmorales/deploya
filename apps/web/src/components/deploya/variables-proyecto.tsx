"use client";

import React, { useState } from 'react';
import { Plus, Eye, EyeOff, Edit2, Trash2, Lock, Save, RotateCcw } from 'lucide-react';

interface VariableItem {
  id: string;
  clave: string;
  valor: string;
  actualizada: string;
  visible?: boolean;
}

interface VariablesProyectoProps {
  variablesIniciales: VariableItem[];
  onGuardar: (variables: VariableItem[]) => void;
}

export const VariablesProyectoComponent: React.FC<VariablesProyectoProps> = ({
  variablesIniciales,
  onGuardar,
}) => {
  const [variables, setVariables] = useState<VariableItem[]>(variablesIniciales);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  const toggleVisibilidad = (id: string) => {
    setVariables(
      variables.map((v) => (v.id === id ? { ...v, visible: !v.visible } : v))
    );
  };

  const actualizarValor = (id: string, nuevoValor: string) => {
    setVariables(
      variables.map((v) => (v.id === id ? { ...v, valor: nuevoValor } : v))
    );
    setCambiosPendientes(true);
  };

  const eliminarVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
    setCambiosPendientes(true);
  };

  const agregarVariable = () => {
    const nueva: VariableItem = {
      id: Date.now().toString(),
      clave: '',
      valor: '',
      actualizada: 'Ahora',
      visible: true,
    };
    setVariables([nueva, ...variables]);
    setCambiosPendientes(true);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Barra de alerta de cambios sin aplicar */}
      {cambiosPendientes && (
        <div className="mb-6 flex items-center justify-between bg-amber-50 border border-amber-200 px-4 py-3 rounded-md text-amber-900 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>2 cambios sin aplicar · Se aplican en el próximo despliegue. El contenedor actual sigue con las anteriores.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setVariables(variablesIniciales);
                setCambiosPendientes(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              <RotateCcw size={12} /> Descartar
            </button>
            <button
              onClick={() => {
                onGuardar(variables);
                setCambiosPendientes(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-black rounded hover:bg-gray-800"
            >
              <Save size={12} /> Guardar y desplegar
            </button>
          </div>
        </div>
      )}

      {/* Cabecera y botón de añadir */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Variables de entorno</h3>
          <p className="text-xs text-gray-500 mt-0.5">Administra las claves secretas y parámetros de configuración.</p>
        </div>
        <button
          type="button"
          onClick={agregarVariable}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} />
          Añadir variable
        </button>
      </div>

      {/* Tabla de variables */}
      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Clave</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Actualizada</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white font-mono text-xs">
            {variables.map((variable) => (
              <tr key={variable.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-900">
                  <input
                    type="text"
                    value={variable.clave}
                    placeholder="CLAVE_ENTORNO"
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                      setVariables(variables.map(v => v.id === variable.id ? { ...v, clave: val } : v));
                      setCambiosPendientes(true);
                    }}
                    className="bg-transparent border border-transparent hover:border-gray-300 focus:border-black px-2 py-1 rounded w-full uppercase outline-none"
                  />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <input
                      type={variable.visible ? 'text' : 'password'}
                      value={variable.valor}
                      placeholder="Valor cifrado"
                      onChange={(e) => actualizarValor(variable.id, e.target.value)}
                      className="bg-transparent border border-transparent hover:border-gray-300 focus:border-black px-2 py-1 rounded w-full outline-none font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibilidad(variable.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title={variable.visible ? "Ocultar valor" : "Mostrar valor"}
                    >
                      {variable.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 font-sans text-xs">
                  {variable.actualizada}
                </td>
                <td className="px-4 py-3 text-right font-sans">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => eliminarVariable(variable.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pie informativo de seguridad */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Lock size={13} className="text-gray-400" />
          <span>Almacenamiento seguro con cifrado AES-256-GCM.</span>
        </div>
        <span>Total: {variables.length} variables</span>
      </div>
    </div>
  );
};