import {
  LogOut,
  ShieldAlert,
} from "lucide-react";

import api from "../services/api";


function ImpersonationBanner() {
  const impersonation =
    JSON.parse(
      localStorage.getItem(
        "impersonation",
      ) || "null",
    );

  if (!impersonation) {
    return null;
  }


  const employee =
    impersonation.employee;


  const handleExit = async () => {
    try {
      await api.post(
        "auth/end-impersonation/",
      );
    } catch (error) {
      console.error(
        "End impersonation error:",
        error,
      );
    }


    const adminAccessToken =
      localStorage.getItem(
        "admin_access_token",
      );

    const adminRefreshToken =
      localStorage.getItem(
        "admin_refresh_token",
      );


    if (adminAccessToken) {
      localStorage.setItem(
        "access_token",
        adminAccessToken,
      );
    }

    if (adminRefreshToken) {
      localStorage.setItem(
        "refresh_token",
        adminRefreshToken,
      );
    }


    localStorage.removeItem(
      "admin_access_token",
    );

    localStorage.removeItem(
      "admin_refresh_token",
    );

    localStorage.removeItem(
      "impersonation",
    );


    window.location.href =
      "/users";
  };


  return (
    <div className="impersonation-banner">
      <div className="impersonation-info">
        <div className="impersonation-icon">
          <ShieldAlert size={17} />
        </div>

        <div>
          <strong>
            Administrator access
          </strong>

          <span>
            You are viewing{" "}
            <b>
              {employee?.full_name ||
                employee?.username}
            </b>
            's account.
          </span>
        </div>
      </div>


      <button
        type="button"
        onClick={handleExit}
      >
        <LogOut size={16} />
        Exit Account
      </button>
    </div>
  );
}


export default ImpersonationBanner;