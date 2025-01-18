import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { createPeriod, createTimetable } from "../../../TimelineApiCalls";
import { useAuth } from "../../../components/AuthContext";
import TimetableCreator from "../../../components/TimeTableCreator";
import { router } from "expo-router";

interface Period {
  course_name: string;
  lecturer: string;
  days: string;
  venue: string;
  start_time: string;
  end_time: string;
  timetable?: number;
}

interface Timetable {
  name: string;
  description: string;
  id?: number; // Add id property to the interface
}

const CreateTimetablePage: React.FC = () => {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      periods: [
        {
          course_name: "",
          lecturer: "",
          days: "",
          venue: "",
          start_time: "",
          end_time: "",
        },
      ],
    },
  });

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string }>(
    {}
  );
  const [endTimes, setEndTimes] = useState<{ [key: string]: string }>({});
  const [timetable, setTimetable] = useState<Timetable>({
    name: "",
    description: "",
  });
  const [periods, setPeriods] = useState<Period[]>([]);
  const [step, setStep] = useState(1); // Step tracker for multi-step form
  const { userToken, userInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  // Mutation for creating a new timetable
  const createTimetableMutation = useMutation<
    any,
    any,
    {
      timetableData: Omit<Timetable, "id"> & { created_by: number | undefined };
      token: string;
    }
  >({
    mutationFn: async ({ timetableData, token }) => {
      return await createTimetable(timetableData, token);
    },
    onSuccess: (data) => {
      setTimetable((prev) => ({ ...prev, id: data.id })); // Assuming the response includes an id
    },
    onError: (error) => {
      alert(error.message || "Error creating timetable");
    },
  });

  // Mutation for creating a new period
  const createPeriodMutation = useMutation<
    any,
    any,
    { periodData: Period; token: string }
  >({
    mutationFn: async ({ periodData, token }) => {
      return await createPeriod({ ...periodData }, token);
    },
    onError: (error) => {
      alert(error.message || "Error creating period");
    },
  });

  // Function to add a new period to the timetable
  const addPeriod = (data: any) => {
    const newPeriod: Period = {
      course_name: data["periods"][0].course_name,
      lecturer: data["periods"][0].lecturer,
      days: selectedDays.join(", "),
      venue: data["periods"][0].venue,
      start_time: selectedTimes[selectedDays[0]] || "",
      end_time: endTimes[selectedDays[0]] || "",
      timetable: timetable.id,
    };
    setPeriods((prev) => [...prev, newPeriod]);

    // Reset form fields for adding another period if needed
    reset({
      name: watch("name"),
      description: watch("description"),
      periods: [
        {
          course_name: "",
          lecturer: "",
          venue: "",
          days: "",
          start_time: "",
          end_time: "",
        },
      ],
    });
    setSelectedDays([]);
    setSelectedTimes({});
    setEndTimes({});
  };

  // Function to save the timetable
  const handleSave = () => {
    const { name, description } = watch();
    if (!name.trim()) {
      alert("Please provide a name for the timetable.");
      return;
    }

    setIsLoading(true); // Show loading indicator

    createTimetableMutation.mutate(
      {
        timetableData: {
          name,
          description,
          created_by: userInfo?.user.id,
        },
        token: userToken?.token!,
      },
      {
        onSuccess: (data) => {
          const timetableId = data.id;

          Promise.all(
            periods.map((period) =>
              createPeriodMutation.mutateAsync({
                periodData: { ...period, timetable: timetableId },
                token: userToken?.token!,
              })
            )
          )
            .then(() => {
              setIsLoading(false);
              router.dismiss(1);
            })
            .catch((error) => {
              setIsLoading(false);
              alert(error.message || "Error creating periods");
            });
        },
        onError: (error) => {
          setIsLoading(false); // Hide loading if timetable creation fails
          alert(error.message || "Error creating timetable");
        },
      }
    );
  };

  // Navigation functions for multi-step form
  const nextStep = () => {
    if (step === 1 && !errors.name) {
      setTimetable({
        name: watch("name"),
        description: watch("description"),
      });
      setStep(step + 1);
      setModalVisible(false); // Close the modal when moving to next step
    } else if (step < 3) {
      setStep(step + 1);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Logging for debugging
  useEffect(() => {
    console.log("Timetable periods:", periods);
    console.log("Timetable details 2:", timetable);
  }, [periods, timetable]);

  useEffect(() => {
    const currentTimetable = watch(["name", "description"]);
    console.log("Timetable details:", currentTimetable);
  }, [watch("name"), watch("description")]);

  return (
    <TimetableCreator
      control={control}
      handleSubmit={handleSubmit}
      watch={watch}
      reset={reset}
      setValue={setValue}
      errors={errors}
      step={step}
      selectedDays={selectedDays}
      setSelectedDays={setSelectedDays}
      selectedTimes={selectedTimes}
      setSelectedTimes={setSelectedTimes}
      endTimes={endTimes}
      setEndTimes={setEndTimes}
      timetable={timetable}
      setTimetable={setTimetable}
      periods={periods}
      setPeriods={setPeriods}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      addPeriod={addPeriod}
      handleSave={handleSave}
      nextStep={nextStep}
      previousStep={previousStep}
      modalVisible={modalVisible}
    />
  );
};

export default CreateTimetablePage;
