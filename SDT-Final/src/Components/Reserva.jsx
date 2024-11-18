import React from "react";
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  serverTimestamp,
  where,
  query,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseconfig";
import horas from "../const/horas";
import Login from "./Login";
import emailjs from "emailjs-com";
import "../styles/reserva.css"; // Asegúrate de crear este archivo para los estilos

function Reserva() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuario, setUsuario] = useState({
    nombre: "",
    correo: "",
    telefono: "",
  });
  const [reserva, setReserva] = useState(true);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [grupo, setGrupo] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [horario, setHorario] = useState(null);
  const [mesasOcupadas, setMesasOcupadas] = useState([]);
  const [horasDisponibles, setHorasDisponibles] = useState([]); // Estado para las horas disponibles
  const [mesasDisponibles, setMesasDisponibles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  // Efecto para cargar horas y mesas desde Firestore
  useEffect(() => {
    const fetchHorariosYMesas = async () => {
      if (!fecha) return; // Si no hay fecha seleccionada, no hace nada
      setIsLoading(true);
      try {
        // Obtener las horas desde la colección "horas" en Firestore, filtrando por la fecha seleccionada
        const horasRef = collection(db, "horas");
        const q = query(horasRef, where("fecha", "==", fecha)); // Filtrar por la fecha seleccionada
        const horariosSnapshot = await getDocs(q);

        // Crear un array para almacenar las horas de esa fecha
        const horariosData = [];
        horariosSnapshot.forEach((doc) => {
          const hora = doc.data().hora; // Asegúrate de que cada documento tenga el campo "hora"
          if (hora) {
            horariosData.push(hora);
          }
        });

        // Combina las horas predeterminadas con las horas obtenidas desde Firestore para esa fecha
        const horasCombinadas = [
          ...horas.map((hora) => hora.value), // Horas predefinidas (suponiendo que el campo correcto es `value`)
          ...horariosData, // Horas desde Firestore para esa fecha
        ];

        // Filtra las horas únicas para evitar duplicados
        const horasUnicas = [...new Set(horasCombinadas)];

        // Actualiza el estado de horasDisponibles con las horas combinadas
        setHorasDisponibles(horasUnicas);

        setIsLoading(false); // Finaliza el estado de carga
      } catch (error) {
        console.error("Error al obtener los horarios desde Firestore:", error);
        setIsLoading(false); // Finaliza el estado de carga en caso de error
      }
    };

    fetchHorariosYMesas();
  }, [fecha]); // Se ejecuta cada vez que la fecha cambia

  // Efecto para verificar mesas ocupadas al seleccionar fecha y horario
  useEffect(() => {
    // Verificar mesas ocupadas cuando se selecciona una fecha y horario
    const fetchMesasOcupadas = async () => {
      if (fecha && horario) {
        const reservasRef = collection(db, "reservas");
        const q = query(
          reservasRef,
          where("fecha", "==", fecha),
          where("horario", "==", horario),
          where("estado", "==", "Confirmada")
        );
        const querySnapshot = await getDocs(q);
        const ocupadas = [];
        querySnapshot.forEach((doc) => {
          ocupadas.push(doc.data().mesa);
        });
        setMesasOcupadas(ocupadas);
      } else {
        setMesasOcupadas([]);
      }
    };

    fetchMesasOcupadas();
  }, [fecha, horario]);

  // Efecto para obtener información del usuario autenticado
  useEffect(() => {
    const fetchUsuario = async (uid) => {
      try {
        const docRef = doc(db, "clientes", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUsuario(docSnap.data());
        } else {
          console.log("No hay tal documento!");
        }
      } catch (error) {
        console.error("Error al obtener el usuario: ", error);
      }
    };

    const token = localStorage.getItem("token");
    const uid = localStorage.getItem("uid");

    if (token && uid) {
      setIsAuthenticated(true);
      fetchUsuario(uid);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleElegirMesa = () => {
    setReserva(false); // al hacer click muestra las mesas
  };

  const handleReserva = () => {
    setReserva(true); // al hacer click muestra el formulario
  };

  const handleSeleccionarMesa = (mesa) => {
    setMesaSeleccionada(mesa); // establece la mesa seleccionada
  };

  // enviar reserva a la bd
  const handleConfrimationReserv = async () => {
    const uid = localStorage.getItem("uid");
    if (mesaSeleccionada && grupo && fecha && horario) {
      try {
        // Crea un documento en la colección "reserva" en Firestore
        await addDoc(collection(db, "reservas"), {
          uid: uid,
          estado: "Confirmada",
          nombre: usuario.nombre, // Usa el nombre del usuario autenticado
          correo: usuario.correo, // Usa el correo del usuario autenticado
          telefono: usuario.telefono, // Usa el teléfono del usuario autenticado
          grupo: grupo, // Usar referencia
          fecha: fecha, // Usar referencia
          horario: horario, // Usar referencia
          mesa: mesaSeleccionada, // Utiliza la mesa seleccionada
          createdAt: serverTimestamp(), // Agregar el timestamp aquí
        });
        alert(
          "Reservación confirmada con éxito!, por favor verifica tu correo"
        );

        let messagueComfirm = `Nombre: ${usuario.nombre}\nEmail: ${usuario.correo}\nTelefono: ${usuario.telefono}\nTmaño del grupo: ${grupo}\nFecha: ${fecha}\nHorario: ${horario}\nN° de mesa: ${mesaSeleccionada}`;
        messagueComfirm += "\n\nMuchas gracias por su preferencia";

        // Configura los datos del mensaje que se envía con EmailJS
        const templateParams = {
          messague: messagueComfirm,
          subject: "Confirmacion de reserva!!",
          email: usuario.correo,
        };

        // Reemplaza 'YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', y 'YOUR_USER_ID' con tus valores de EmailJS
        emailjs
          .send(
            "service_4ie5ez4",
            "template_rqpmnbl",
            templateParams,
            "msvOlm1YjIR6h1Xs5"
          )
          .then((response) => {
            console.log(
              "Reserva enviada con éxito:",
              response.status,
              response.text
            );
            console.log(templateParams);
          })
          .catch((error) => {
            console.error("Error al enviar el correo:", error);
            alert("Hubo un error al enviar el correo");
          });
      } catch (error) {
        console.error("Error al confirmar la reservación: ", error);
        alert("Hubo un problema al confirmar la reservación.");
      }
    }
  };

  return (
    <main>
      {isAuthenticated ? (
        // Si está autenticado, muestra el formulario de reserva
        <div className="reservation">
          {reserva ? (
            <form>
              <h1>¡Reserva ahora!</h1>
              <p>Nombre: {usuario.nombre}</p>
              <p>Correo: {usuario.correo}</p>
              <p>Teléfono: {usuario.telefono}</p>

              <label htmlFor="grupo">Tamaño del grupo:</label>
              <select
                name="grupo"
                id="grupo"
                required
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
              >
                <option value="" disabled selected>
                  Seleccione el tamaño del grupo
                </option>
                <option value="1">1 persona</option>
                <option value="2">2 personas</option>
                <option value="3">3 personas</option>
                <option value="4">4 personas</option>
                <option value="5">5 personas</option>
                <option value="6">6 personas</option>
              </select>

              <label htmlFor="fecha">Fecha:</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)} // Actualiza el estado de la fecha
              />

              <label htmlFor="horario">Horario:</label>
              <select name="horario" id="horario">
                {isLoading ? (
                  <option value="">Cargando...</option> // Muestra "Cargando..." mientras se obtienen los datos
                ) : horasDisponibles.length > 0 ? (
                  horasDisponibles.map((hora) => (
                    <option key={hora} value={hora}>
                      {hora}
                    </option>
                  ))
                ) : (
                  <option value="">
                    No hay horarios disponibles para esta fecha
                  </option> // Si no hay horarios disponibles, muestra un mensaje
                )}
              </select>

              <button type="button" id="elegir-mesa" onClick={handleElegirMesa}>
                Elegir Mesa.
              </button>
            </form>
          ) : (
            <div id="mesa-container">
              <h3>Elige una mesa</h3>
              <div id="mesas">
                {mesasDisponibles.map((mesa) => (
                  <button
                    key={mesa}
                    id="mesa-btn"
                    onClick={() => handleSeleccionarMesa(mesa)}
                    style={{
                      backgroundColor: mesasOcupadas.includes(mesa)
                        ? "red"
                        : mesaSeleccionada === mesa
                        ? "green"
                        : "#746743",
                    }}
                    disabled={mesasOcupadas.includes(mesa)} // Desactiva el botón si está ocupada
                  >
                    {mesa}
                  </button>
                ))}
              </div>
              {mesaSeleccionada && (
                <button id="confirmar-mesa" onClick={handleConfrimationReserv}>
                  Confirmar Reservación.
                </button>
              )}
              <button type="button" id="volver" onClick={handleReserva}>
                Volver atrás.
              </button>
            </div>
          )}
        </div>
      ) : (
        // Si no está autenticado, muestra el mensaje de inicio de sesión
        <Login />
      )}
    </main>
  );
}

export default Reserva;
