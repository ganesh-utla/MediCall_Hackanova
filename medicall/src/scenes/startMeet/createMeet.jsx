import { JitsiMeeting } from "@jitsi/react-sdk";
import { Box, TextField, useTheme, Button, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import httpClint from "../../httpClint";
import { tokens } from "../../theme";
import { Formik } from "formik";

const JitsiComponent = () => {
  const apiRef = useRef();
  const [logItems, updateLog] = useState([]);
  const [knockingParticipants, updateKnockingParticipants] = useState([]);
  const [searchparams] = useSearchParams();
  const meetId = searchparams.get("meetId");
  const navigate = useNavigate();
  const loggedIn = localStorage.getItem("registerAs");
  const isDoctor = loggedIn ? loggedIn.toString() : "na";
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  // console.log(meetId);

  const printEventOutput = (payload) => {
    updateLog((items) => [...items, JSON.stringify(payload)]);
  };

  const handleAudioStatusChange = (payload, feature) => {
    if (payload.muted) {
      updateLog((items) => [...items, `${feature} off`]);
    } else {
      updateLog((items) => [...items, `${feature} on`]);
    }
  };

  const handleChatUpdates = (payload) => {
    if (payload.isOpen || !payload.unreadCount) {
      return;
    }
    apiRef.current.executeCommand("toggleChat");
    updateLog((items) => [
      ...items,
      `you have ${payload.unreadCount} unread messages`,
    ]);
  };

  const handleKnockingParticipant = (payload) => {
    updateLog((items) => [...items, JSON.stringify(payload)]);
    updateKnockingParticipants((participants) => [
      ...participants,
      payload?.participant,
    ]);
  };

  const resolveKnockingParticipants = (condition) => {
    knockingParticipants.forEach((participant) => {
      apiRef.current.executeCommand(
        "answerKnockingParticipant",
        participant?.id,
        condition(participant)
      );
      updateKnockingParticipants((participants) =>
        participants.filter((item) => item.id === participant.id)
      );
    });
  };

  const handleJitsiIFrameRef1 = (iframeRef) => {
    iframeRef.style.border = "10px solid #3d3d3d";
    iframeRef.style.background = "#3d3d3d";
    iframeRef.style.height = "400px";
    iframeRef.style.marginBottom = "20px";
  };

  const handleApiReady = (apiObj) => {
    apiRef.current = apiObj;
    apiRef.current.on("knockingParticipant", handleKnockingParticipant);
    apiRef.current.on("audioMuteStatusChanged", (payload) =>
      handleAudioStatusChange(payload, "audio")
    );
    apiRef.current.on("videoMuteStatusChanged", (payload) =>
      handleAudioStatusChange(payload, "video")
    );
    apiRef.current.on("raiseHandUpdated", printEventOutput);
    apiRef.current.on("titleViewChanged", printEventOutput);
    apiRef.current.on("chatUpdated", handleChatUpdates);
    apiRef.current.on("knockingParticipant", handleKnockingParticipant);
  };

  const handleReadyToClose = () => {
    console.log("Ready to close...");
  };

  const handleEndMeeting = () => {
    if (isDoctor === "doctor") {
      httpClint
        .get("/del-meet")
        .then((response) => {
          navigate("/");
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      navigate("/invoice");
    }
  };

  // const generateRoomName = () => `JitsiMeetRoomNo${Math.random() * 100}-${Date.now()}`;
  const generateRoomName = () => meetId;

  const renderButtons = () => (
    <div style={{ margin: "15px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          type="text"
          title="Click to execute toggle raise hand command"
          style={{
            border: 0,
            borderRadius: "6px",
            fontSize: "14px",
            background: "#f8ae1a",
            color: "#040404",
            padding: "12px 46px",
            margin: "2px 2px",
          }}
          onClick={() => apiRef.current.executeCommand("toggleRaiseHand")}
        >
          Raise hand
        </button>
        <button
          type="text"
          title="Click to approve/reject knocking participant"
          style={{
            border: 0,
            borderRadius: "6px",
            fontSize: "14px",
            background: "#0056E0",
            color: "white",
            padding: "12px 46px",
            margin: "2px 2px",
          }}
          onClick={() =>
            resolveKnockingParticipants(({ name }) => !name.includes("test"))
          }
        >
          Resolve lobby
        </button>
        <button
          type="text"
          title="Click to execute subject command"
          style={{
            border: 0,
            borderRadius: "6px",
            fontSize: "14px",
            background: "#3D3D3D",
            color: "white",
            padding: "12px 46px",
            margin: "2px 2px",
          }}
          onClick={() =>
            apiRef.current.executeCommand("subject", "New Subject")
          }
        >
          Change subject
        </button>
        <button
          type="text"
          title="Click to end the meeting"
          style={{
            border: 0,
            borderRadius: "6px",
            fontSize: "14px",
            background: "#df486f",
            color: "white",
            padding: "12px 46px",
            margin: "2px 2px",
          }}
          onClick={() => handleEndMeeting()}
        >
          End Meeting
        </button>
      </div>
    </div>
  );

  const renderSpinner = () => (
    <div
      style={{
        fontFamily: "sans-serif",
        textAlign: "center",
      }}
    >
      Loading..
    </div>
  );

  const initialValues = {
    email: localStorage.getItem("email"),
    prescription: "",
  };

  const handleFormSubmit = (values) => {
    // console.log(initialValues.email, values);
    httpClint
      .post("/add-pres", values)
      .then((response) => {
        console.log(response)
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <Box m="20px auto" p="0 20px" minHeight="85vh">
      <h1
        style={{
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        Video Meet
      </h1>
      <JitsiMeeting
        roomName={generateRoomName()}
        spinner={renderSpinner}
        configOverwrite={{
          subject: "Meeting",
          hideConferenceSubject: false,
        }}
        onApiReady={(externalApi) => handleApiReady(externalApi)}
        onReadyToClose={handleReadyToClose}
        getIFrameRef={handleJitsiIFrameRef1}
      />

      {renderButtons()}

      {isDoctor && (
        <Formik onSubmit={handleFormSubmit} initialValues={initialValues}>
          {({ values, handleChange, handleBlur, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <Box mb="30px">
                <TextField
                  fullWidth
                  id="prescription"
                  name="prescription"
                  label="Prescription"
                  variant="outlined"
                  value={values.prescription}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  sx={{
                    color: `${colors.grey[100]}`,
                    borderColor: `${colors.grey[100]}`,
                    width: "70%",
                    display: "block"
                  }}
                />
                <Button
                  style={{
                    backgroundColor: `${colors.blueAccent[500]}`,
                    color: "white",
                    padding: "6px 15px",
                    borderRadius: "10px",
                    border: `2px solid ${colors.blueAccent[900]}`,
                  }}
                  type="submit"
                >
                  <Typography sx={{ fontSize: "18px", marginLeft: "10px" }}>
                    Send
                  </Typography>
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      )}
    </Box>
  );
};

export default JitsiComponent;
