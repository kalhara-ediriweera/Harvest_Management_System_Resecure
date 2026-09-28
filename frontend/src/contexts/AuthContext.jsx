import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import axios from "axios";


const AuthContext =
  createContext();

const API_BASE_URL =
  "http://localhost:5000";


// Get only the normal user information
// from Local Storage.

// No JWT is stored here.
const getStoredUser = () => {

  try {

    const storedUser =
      localStorage.getItem(
        "user"
      );

    return storedUser
      ? JSON.parse(storedUser)
      : null;

  } catch {

    return null;

  }
};


export const AuthProvider = ({
  children
}) => {

  const [
    currentUser,
    setCurrentUser
  ] = useState(
    getStoredUser
  );


  // Restore authentication
  // using the HttpOnly cookie.
  useEffect(() => {

    const restoreSession =
      async () => {

        try {

          const res =
            await axios.get(
              `${API_BASE_URL}/api/auth/profile`
            );


          setCurrentUser(
            res.data
          );


          // Only normal user data
          // is stored.
          localStorage.setItem(
            "user",
            JSON.stringify(
              res.data
            )
          );

        } catch (error) {

          setCurrentUser(
            null
          );

          localStorage.removeItem(
            "user"
          );
        }
      };


    restoreSession();

  }, []);


  // =========================
  // Login
  // =========================
  const login = async (
    data
  ) => {

    const res =
      await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        data
      );


    setCurrentUser(
      res.data.user
    );


    // Store only user information.
    // JWT is NOT stored.
    localStorage.setItem(
      "user",
      JSON.stringify(
        res.data.user
      )
    );
  };


  // =========================
  // Register
  // =========================
  const register =
    async (data) => {

      const res =
        await axios.post(
          `${API_BASE_URL}/api/auth/register`,
          data
        );


      setCurrentUser(
        res.data.user
      );


      // Store only user information.
      localStorage.setItem(
        "user",
        JSON.stringify(
          res.data.user
        )
      );
    };


  // =========================
  // Logout
  // =========================
  const logout =
    async () => {

      try {

        await axios.post(
          `${API_BASE_URL}/api/auth/logout`
        );

      } catch (error) {

        console.error(
          "Logout request failed:",
          error
        );

      } finally {

        setCurrentUser(
          null
        );

        localStorage.removeItem(
          "user"
        );

        window.location.href =
          "/";
      }
    };


  return (

    <AuthContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout
      }}
    >

      {children}

    </AuthContext.Provider>
  );
};


export const useAuth = () =>
  useContext(AuthContext);