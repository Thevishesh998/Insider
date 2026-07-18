import React, { useEffect, useState, useContext } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
const ViewApplications = () => {
  const { backendUrl, companyToken } = useContext(AppContext);

  const [applications, setApplications] = useState([]);

  const fetchApplicants = async () => {
    const { data } = await axios.get(backendUrl + "/api/company/applicants", {
      headers: {
        Authorization: `Bearer ${companyToken}`,
      },
    });

    if (data.success) {
      setApplications(data.applications);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [companyToken]);

  const updateStatus = async (id, status) => {
    const { data } = await axios.post(
      backendUrl + "/api/company/change-status",
      {
        applicationId: id,
        status,
      },
      {
        headers: {
          Authorization: `Bearer ${companyToken}`,
        },
      },
    );

    if (data.success) {
      toast.success("Status Updated");
      fetchApplicants();
    }
  };
  return (
    <div className="container mx-auto p-4">
      <div>
        <table className="w-full max-w-4xl bg-white border border-gray-200 max-sm:text-sm">
          <thead>
            <tr className="border-b ">
              <th className="py-2 px-4 text-left">#</th>
              <th className="py-2 px-4 text-left">User name</th>
              <th className="py-2 px-4 text-left max-sm:hidden">Job Title</th>
              <th className="py-2 px-4 text-left max-sm:hidden">Location</th>
              <th className="py-2 px-4 text-left">Resume</th>
              <th className="py-2 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((applicant, index) => (
              <tr key={index} className="text-gray-700">
                <td className="py-2 px-4 border-b text-center">{index + 1}</td>
                <td className="py-2 px-4 border-b text-center flex">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 mr-3 flex items-center justify-center font-semibold">
                    {`U${index + 1}`}
                  </div>
                  <span>{`Applicant ${index + 1}`}</span>
                </td>
                <td className="py-2 px-4 border-b max-sm:hidden">
                  {applicant.jobId.title}
                </td>
                <td className="py-2 px-4 border-b max-sm:hidden">
                  {applicant.jobId.location}
                </td>
                <td className="py-2 px-4 border-b">
                  <a
                    href={applicant.userId?.resume}
                    target="_blank"
                    className="bg-blue-50 text-blue-400 px-3 py-1 rounded inline-flex gap-2 items-center"
                  >
                    Resume <img src={assets.resume_download_icon} alt="" />
                  </a>
                </td>
                <td className="py-2 px-4 border-b relative">
                  <div className="relative inline-block text-left group">
                    <button className="text-gray-500 action-button">...</button>
                    <div
                      className="z-10 hidden absolute right-0 md:left-0 top-0 mt-2 w-32 bg-white border 
                                        border-gray-200 rounded shadow group-hover:block"
                    >
                      <button
                        onClick={() => updateStatus(applicant._id, "Accepted")}
                        className="block w-full text-left px-4 py-2 text-blue-500 hover:bg-gray-100"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(applicant._id, "Rejected")}
                        className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ViewApplications;
