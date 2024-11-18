import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseconfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore"; // Asegúrate de tener las funciones necesarias
import "../styles/VistReservaAdmin.css"; // Asegúrate de crear este archivo para los estilos

const GestionMesas = () => {
  const [mesas, setMesas] = useState([]);
  const [nuevaMesa, setNuevaMesa] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [horasPredefinidas] = useState(['12:00', '13:30', '15:00', '16:30', '18:00']);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaNueva, setHoraNueva] = useState('');
  const [mensajeHoras, setMensajeHoras] = useState('');
  const [editarHoras, setEditarHoras] = useState(false);

  // Función para obtener las mesas desde Firebase
  const obtenerMesas = async () => {
    const mesasCollection = collection(db, "mesas");
    const mesasSnapshot = await getDocs(mesasCollection);
    const mesasList = mesasSnapshot.docs.map((doc) => ({
      id: doc.id,
      numero: doc.data().numero,
    }));
    setMesas(mesasList);
  };

  // Función para eliminar una mesa
  const eliminarMesa = async (id) => {
    try {
      await deleteDoc(doc(db, "mesas", id)); // Eliminar la mesa de Firebase
      obtenerMesas(); // Actualizar la lista de mesas
      setMensaje("Mesa eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar la mesa: ", error);
      setMensaje("Hubo un error al eliminar la mesa");
    }
  };

  // Función para agregar una mesa
  const agregarMesa = async () => {
    if (nuevaMesa && !isNaN(nuevaMesa) && nuevaMesa > 0) {
      const mesaExistente = mesas.find((mesa) => mesa.numero === nuevaMesa);
      if (mesaExistente) {
        setMensaje("Ya existe una mesa con ese número");
        return;
      }

      try {
        const mesaRef = doc(db, "mesas", nuevaMesa.toString());
        await setDoc(mesaRef, { numero: nuevaMesa });
        setNuevaMesa("");
        obtenerMesas(); // Actualiza la lista de mesas después de agregarla
        setMensaje("Mesa agregada correctamente");
      } catch (error) {
        console.error("Error al agregar la mesa: ", error);
        setMensaje("Hubo un error al agregar la mesa");
      }
    } else {
      setMensaje("Por favor, ingresa un número de mesa válido");
    }
  };

  // Función para obtener las horas de un día seleccionado
  const obtenerHorasDisponibles = async (fecha) => {
    setFechaSeleccionada(fecha);
    const horasCollection = collection(db, 'horas');
    const horasSnapshot = await getDocs(horasCollection);
    const horasList = horasSnapshot.docs
      .filter(doc => doc.data().fecha === fecha)
      .map(doc => doc.data().hora);

    const horasConPredefinidas = [...new Set([...horasList, ...horasPredefinidas])].sort();
    setHorasDisponibles(horasConPredefinidas);
  };

  // Función para agregar una hora
  const agregarHora = async () => {
    if (
      horaNueva &&
      horaNueva >= '08:00' &&
      (horaNueva <= '23:59' || horaNueva <= '02:00')
    ) {
      try {
        const horaRef = doc(db, 'horas', `${fechaSeleccionada}_${horaNueva}`);
        await setDoc(horaRef, { fecha: fechaSeleccionada, hora: horaNueva });
        setHoraNueva('');
        obtenerHorasDisponibles(fechaSeleccionada);
        setMensajeHoras('Hora agregada correctamente');
      } catch (error) {
        console.error("Error al agregar la hora: ", error);
        setMensajeHoras('Hubo un error al agregar la hora');
      }
    } else {
      setMensajeHoras('Por favor, ingresa una hora válida entre las 08:00 y las 02:00');
    }
  };

  // Función para eliminar una hora
  const eliminarHora = async (hora) => {
    try {
      const horaRef = doc(db, 'horas', `${fechaSeleccionada}_${hora}`);
      await deleteDoc(horaRef);
      obtenerHorasDisponibles(fechaSeleccionada);
      setMensajeHoras('Hora eliminada correctamente');
    } catch (error) {
      console.error("Error al eliminar la hora: ", error);
      setMensajeHoras('Hubo un error al eliminar la hora');
    }
  };

  // Efecto para cargar las mesas al iniciar
  useEffect(() => {
    obtenerMesas();
  }, []);


  return (
    <div className="gestion">
      <h2>Gestión de Mesas y Horas</h2>
      {mensaje && <div className="alert">{mensaje}</div>}

      <div className="gestion-mesas">
        <input
          type="number"
          value={nuevaMesa}
          onChange={(e) => setNuevaMesa(e.target.value)}
          placeholder="Número de mesa"
        />
        <button onClick={agregarMesa}>Agregar Mesa</button>

        <div className="mesa-grid">
          {mesas.map((mesa) => (
            <div key={mesa.id} className="mesa-btn">
              <span>{mesa.numero}</span>
              <button onClick={() => eliminarMesa(mesa.id)}>Eliminar</button>
            </div>
          ))}
        </div>
      </div>

      <div className="gestion-horas">
        <h3>Gestión de Horas Disponibles</h3>
        <input
          type="date"
          onChange={(e) => obtenerHorasDisponibles(e.target.value)}
        />
        {fechaSeleccionada && (
          <div>
            <h4>Horas para {fechaSeleccionada}</h4>
            <ul>
              {horasDisponibles.map((hora, index) => (
                <li key={index}>
                  {hora}
                  {editarHoras && (
                    <button onClick={() => eliminarHora(hora)}>Eliminar</button>
                  )}
                </li>
              ))}
            </ul>
            {editarHoras ? (
              <>
                <input
                  type="time"
                  value={horaNueva}
                  onChange={(e) => setHoraNueva(e.target.value)}
                  max="02:00"
                  min="08:00"
                />
                <button onClick={agregarHora}>Agregar Hora</button>
                <button onClick={() => setEditarHoras(false)}>
                  Dejar de editar
                </button>
              </>
            ) : (
              <button onClick={() => setEditarHoras(true)}>Editar Horas</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionMesas;