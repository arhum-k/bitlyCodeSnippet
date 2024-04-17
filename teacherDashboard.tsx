"use client"
import Layout from '@/app/layouts/Layout';
import React, { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../../../config/firebase";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { PracticeSet } from "@/app/types";
import { BsArrowLeftCircle } from 'react-icons/bs';


export default function StudentActivityLog({ params }: { params: { id: string } }) {


    //STATE VARIABLES 
    
    const character = "Jarvis"
    const [setId, setSetId] = useState<string | undefined>();
    const [teacherId, setTeacherId] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [enrolledStudents, setEnrolledStudents] = useState<string[] | undefined>();
    const [studentsData, setStudentsData] = useState<any>({});
    const [practiceSetTitle, setPracticeSetTitle] = useState<string | undefined>();
    const [practiceSetQuestions, setPracticeSetQuestions] = useState<any>({});
    const [currentStudentId, setCurrentStudentId] = useState<string | undefined>();
    const [currentUserAnalysis, setCurrentUserAnalysis] = useState<any>({})
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [allUserAnalysis, setAllUserAnalysis] = useState<Record<string, any>>({});


    
    interface Chat {
        role: string;
        content: string;
    }

    
    useEffect(() => {
        const idParts = params.id.split('-');
        setTeacherId(idParts[0])
        setSetId(idParts[1]);
    }, []);

    useEffect(() => {
        if (teacherId && setId) {
            const fetchData = async () => {
                const path = `teachers/${teacherId}/practiceSets/${setId}`;
                const docRef = doc(db, path);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as PracticeSet;
                    setPracticeSetTitle(data.title)
                    setEnrolledStudents(data.enrolledStudentIds);
                    setPracticeSetQuestions(data.questions)
                    data.enrolledStudentIds.map((e) => fetchStudentData(e))
                };
            }
            fetchData();
        }
    }, [teacherId, setId]);

    const fetchStudentData = async (studentId: string) => {

        const path = `students/${studentId}/practiceSets/${setId}`;
        const docRef = doc(db, path);
        const docSnap = await getDoc(docRef);
        const namePath = `students/${studentId}`
        const nameDocRef = doc(db, namePath)
        const nameDocSnap = await getDoc(nameDocRef)

        if (docSnap.exists() && nameDocSnap.exists()) {
            const nameData = nameDocSnap.data();
            const name = nameData ? nameData.name : null;
            const email = nameData ? nameData.email : null;
            setStudentsData((prevStudentsData: Record<string, any>) => ({
                ...prevStudentsData,
                [studentId]: {
                    ...docSnap.data(),
                    email: email,
                    name: name
                }
            }))
        }
    }

    const handleStudentClick = (studentId: string) => {
        setCurrentStudentId(studentId);
        setShowAnalysis(false)
    }

    const handleAnalyze = async (studentId: string) => {
        if (allUserAnalysis[studentId]) {
            console.log("Analysis already exists for this student");
            setCurrentUserAnalysis(allUserAnalysis[studentId])
            return;
        }
    
        try {
            const requestBody: any = {
                chatHistory: studentsData[studentId].chatHistory,
            };

            const response = await fetch("/api/generate/generateAnalysis", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setCurrentUserAnalysis(data.data)
            setAllUserAnalysis(prevAnalysis => ({
                ...prevAnalysis,
                [studentId]: data.data
            }));
            console.log(allUserAnalysis)
            console.log(allUserAnalysis[studentId])
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }

    return (
        <Layout>
            <div className="h-screen bg-white text-black">
                <h1 className="text-center pt-5 text-4xl font-bold p-6">{practiceSetTitle} Dashboard</h1>
                <h1 className="text-center pt-5 text-4xl text-medium-gray font-bold p-6">This feature is still in beta</h1>
                
                {/*Code to display the student analysis (decided not to display until the prompt for the backend GPT call was perfected)*/}
                {/* <button
                    className="bg-green-500 text-white mb-2 px-4 py-2 rounded-md text-lg mt-4 mx-auto block"
                    onClick={() => {
                        currentStudentId && handleAnalyze(currentStudentId)
                        setShowAnalysis(!showAnalysis);
                    }}
                >
                    Toggle Conversation Analysis
                </button>
                {showAnalysis && (
                    <div className="bg-gray-100 p-4 px-4 pb-4 rounded-md mt-4 mx-4 mb-4">
                        {JSON.stringify(currentUserAnalysis, null, 2)}
                    </div>
                )}
                 */}
                <div className="flex">
                    <div className="bg-light-gray w-1/5 rounded-3xl resize-x overflow-auto ml-4 mr-4">
                        <h1 className="text-left text-xl font-bold ml-3 pt-5 pb-2">Students</h1>
                        {Object.keys(studentsData).map((studentId, index) => (
                            <button
                                key={index}
                                className={`ml-5 mb-2 border text-white rounded-md pt-1 px-2 pb-1 transition-all duration-300  transform origin-bottom-left ${currentStudentId === studentId ? 'bg-purple-500 scale-110' : 'bg-gray-500'}`} // Added conditional classes for background color
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleStudentClick(studentId)}
                            >
                                {studentsData[studentId].name ? studentsData[studentId].name : studentsData[studentId].email}
                            </button>
                        ))}
                    </div>
                    
                    {currentStudentId ? (
                        <div className="bg-light-gray rounded-3xl p-6 mb-3 w-3/4 overflow-auto">
                            <div className='text-left'>
                                <h1 className="text-center text-2xl font-extrabold pt-5">
                                    {studentsData[currentStudentId]?.selectedCharacter?.name &&
                                        (studentsData[currentStudentId].name || studentsData[currentStudentId].email) + "'s Conversation With " + studentsData[currentStudentId]?.selectedCharacter?.name
                                    }
                                </h1>

                                {/* Code to display each question (didn't display b/c of data formattng issues on backend, displayed entire conversation instead) */}
                                {/* <div className='text-right mt-3 mb-3'>
                                {currentQuestionIndex > 0 ? (
                                    <button
                                        className="bg-purple-500 text-white px-4 py-2 rounded-md text-lg mr-2"
                                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                                    >
                                        Previous Question
                                    </button>
                                ) : null}
                                {currentQuestionIndex < questions.length - 1 ? (
                                    <button
                                        className="bg-green-500 text-white px-4 py-2 rounded-md text-lg"
                                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                    >
                                        Next Question
                                    </button>
                                ) : null}
                            </div>
                                <span className="font-semibold text-lg">Question {currentQuestionIndex + 1}: </span>
                                <span className='text-lg'>
                                    {practiceSetQuestions[currentQuestionIndex] ? practiceSetQuestions[currentQuestionIndex].question : 'No question available'}
                                </span>
                                <br />
                                <span className="font-semibold text-lg">Answer: </span>
                                <span className="text-lg">
                                    {practiceSetQuestions[currentQuestionIndex] ? practiceSetQuestions[currentQuestionIndex].answer : 'No answer available'}
                                </span> */}

                                {/* ChatBox code */}
                                <div className="chat-history mt-4 flex flex-col">
                                    {currentStudentId && studentsData[currentStudentId] && Array.isArray(studentsData[currentStudentId].chatHistory)
                                        ? studentsData[currentStudentId].chatHistory.map((chat: Chat, index: number) => (
                                            chat.role !== 'system' && (
                                                <div key={index} className={`flex flex-col ${chat.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                                                    <div className="font-bold">{chat.role === 'assistant' ? character : (studentsData[currentStudentId].name || studentsData[currentStudentId].email)}</div>
                                                    <div className={`chat-message ${chat.role === 'assistant' ? 'bg-gray-500 text-white' : 'bg-purple-500 text-white'} p-2 mt-1 mb-2 rounded-md`}>
                                                        {chat.content}
                                                    </div>
                                                </div>
                                            )
                                        ))
                                        : <h1 className='text-center text-2xl font-extrabold pt-5'>{currentStudentId && (studentsData[currentStudentId].name || studentsData[currentStudentId].email)} has no chat history. </h1>
                                    }
                                </div>
                            </div>
                        </div>

                    ) : (
                        <div className="bg-light-gray rounded-3xl p-6 mb-3 w-3/4 overflow-auto flex justify-center items-cente  space-x-4">
                            <BsArrowLeftCircle size={50} className="mt-3" />
                            <h1 className="text-center text-2xl font-extrabold pt-5">Select a Student from the Left!</h1>

                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
