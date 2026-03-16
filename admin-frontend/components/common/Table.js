import Link from "next/link";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {
  setExpert,
  setExpertCommunities,
  setExpertSessions,
} from "@/store/features/expert";
import { setPartner } from "@/store/features/partnerSlice";
import { toast } from "react-toastify";
import api from "@/utils/apiSetup";
import { setAllTickets, setSelectedTicket } from "@/store/features/ticket";
import { MdDelete } from "react-icons/md";
import {
  selectCommunity,
  setCommunityUsers,
} from "@/store/features/communitySlice";
import { getFormattedDate, numDays } from "@/utils/numDays";
import { setUserCommunities, setUserDetails, setUserMemberships, setUserSessions } from "@/store/features/userSlice";
import Card from "./Card";

const Table = ({ mode, headers, data, baseURL, onContextMenu, onManage }) => {
  const dispatch = useDispatch();
  const community = useSelector(selectCommunity);
  const resolveTicket = async (ticketId) => {
    let res = await api.patch(`/ticket/${ticketId}`, { isResolved: true });
    if (res.data) {
      toast(`Resolved ticket!`, { type: "success" });
      dispatch(setAllTickets());
    }
  };

  const findNames = (community) => {
    let result = "";
    if (!community || community.length === 0) {
      return result;
    }
    community.forEach((item) => {
      result = result + item.title + ",";
    });
    return result;
  };

  // Reduces each slot startTime-endTime, to a string
  const reduceToString = (slotsArr) => {
    if (!slotsArr) {
      return "-";
    }
    return slotsArr
      .map((item) => {
        let startTime = new Date(item.startTime);
        let endTime = new Date(item.endTime);
        return `${startTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}-${endTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      })
      .join(",");
  };

  const reduceSpeakers = (slotsArr) => {
    if (!slotsArr) {
      return "-";
    }
    let speakerObj = {};
    slotsArr.forEach((item) => {
      if (!speakerObj[item.speaker.name]) {
        speakerObj = { ...speakerObj, [item.speaker.name]: true };
      }
    });
    return Object.keys(speakerObj).join(",");
  };

  const clampString = (string, number) => {
    if (string?.length < number) {
      return string;
    } else {
      return `${string?.slice(0, number)} ...`;
    }
  };

  const compareDates = (endTime) => {
    if (!endTime) {
      return "";
    }
    const today = new Date();
    const endDate = new Date(endTime);
    if (endDate < today) {
      return "Pending";
    }
    return "Active";
  };
  const router = useRouter();
  const handleEditExpert = (index) => {
    dispatch(setExpert(data[index]));
    if (data[index].id) {
      router.push(`/${baseURL}/expert/add/${data[index].id}`);
    }
  };

  const handleEditUser = (index) => {
    if (data[index].id) {
      router.push(`/${baseURL}/people/add/${data[index].id}`);
    }
  };

  const handleViewUser = (index) => {
    dispatch(setUserDetails(index))
    dispatch(setUserMemberships(index))
    dispatch(setUserSessions(index))
    router.push(`/${baseURL}/people/${index}`)
  }

  const handleViewExpert = (index) => {
    dispatch(setExpert(data[index]));
    dispatch(setExpertSessions(data[index].id));
    dispatch(setExpertCommunities(data[index].id));
    if (data[index].id) {
      router.push(`/${baseURL}/expert/${data[index].id}`);
    }
  };
  const handleEditPartner = (index) => {
    dispatch(setPartner(data[index].id));
    if (data[index].id) {
      router.push(`/admin/partner/add/${data[index].id}`);
    }
  };
  const handleResolveTicket = (index) => {
    if (data[index].isResolved) {
      toast("Ticket already resolved", { type: "warning" });
    } else {
      resolveTicket(data[index].id);
    }
  };

  const handleViewTicket = (index) => {
    dispatch(setSelectedTicket(data[index]));
    if (data[index].id) {
      router.push(`/admin/ticket/${data[index].id}`);
    }
  };

  const handleDeleteSubscription = (index) => {
    let ans = confirm(`Delete user ${data[index].name}`);
    if (ans) {
      api
        .delete(`/pay/subscription/${data[index].subscriptionId}`)
        .then((res) => {
          dispatch(setCommunityUsers(community.id));
        });
    }
  };

  const handlePartnerRemove = async () => {
    try {
      api.patch(`/community/${community.id}`, {
        creatorId: null,
      });
      toast.success("Removed partner from community");
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.log(err);
      toast("Could not remove partner", err.response.data.message);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto ">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            {mode === "expert" && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers?.map((item, index) => (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        key={`item-${index}`}
                      >
                        {item}
                      </th>
                    ))}

                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.map((item, index) => (
                    <tr key={`Meeting-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="text-sm font-medium text-gray-900">
                            {index + 1}
                          </div>
                          {/* <div className="text-sm text-gray-500">{person.email}</div> */}
                        </div>
                      </td>

                      <td className="py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          {/* <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={item?.photoURL}
                              alt={""}
                            />
                          </div> */}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {clampString(item?.desc, 50)}
                        </div>
                        {/* <div className="text-sm text-gray-500">{person.department}</div> */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item?.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item?.SessionSlots?.length || 0}
                        </div>
                      </td>
                      {/* add community tag */}
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        {router.pathname !== "/partner/expert" && (
                          <p
                            className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                            onClick={() => handleEditExpert(index)}
                          >
                            Edit
                          </p>
                        )}
                        <p
                          className="text-pink-600 hover:text-indigo-900 py-3 cursor-pointer"
                          onClick={() => handleViewExpert(index)}
                        >
                          View
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {mode === "partner" && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers?.map((item, index) => (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        key={`item-${index}`}
                      >
                        {item}
                      </th>
                    ))}

                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.map((item, index) => (
                    <tr key={`Meeting-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="text-sm font-medium text-gray-900">
                            {index + 1}
                          </div>
                          {/* <div className="text-sm text-gray-500">{person.email}</div> */}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="text-sm text-gray-900">
                            {item?.phone}
                          </div>
                        </div>
                        {/* <div className="text-sm text-gray-500">{person.department}</div> */}
                      </td>

                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {clampString(findNames(item.Community), 80) || 0}
                        </div>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <p
                          className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                          onClick={() => handleEditPartner(index)}
                        >
                          Edit
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {mode === "ticket" && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers?.map((item, index) => (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        key={`item-${index}`}
                      >
                        {item}
                      </th>
                    ))}

                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.map((item, index) => (
                    <tr key={`Ticket-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="text-sm font-medium text-gray-900">
                            {index + 1}
                          </div>
                          {/* <div className="text-sm text-gray-500">{person.email}</div> */}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item?.raisedBy?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item?.raisedBy?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {clampString(item.content, 80)}
                        </div>
                        {/* <div className="text-sm text-gray-500">{person.department}</div> */}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item?.domain}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={
                            item?.isResolved
                              ? "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                              : "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-black"
                          }
                        >
                          {item?.isResolved ? "Resolved" : "unResolved"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <p
                          className="text-pink-600 hover:text-indigo-900 py-3 cursor-pointer"
                          onClick={() => handleViewTicket(index)}
                        >
                          View
                        </p>
                        <p
                          className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                          onClick={() => handleResolveTicket(index)}
                        >
                          Resolve
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {mode === "user" && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers?.map((item, index) => (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        key={`item-${index}`}
                      >
                        {item}
                      </th>
                    ))}
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.map((item, index) => (
                    <tr key={`Meeting-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="text-sm font-medium text-gray-900">
                            {index + 1}
                          </div>
                          {/* <div className="text-sm text-gray-500">{person.email}</div> */}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start justify-left ">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item?.phone}
                        </div>
                        {/* <div className="text-sm text-gray-500">{person.department}</div> */}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {clampString(item?.desc, 50)}
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <p className="btn blue-tag">
                          {item?.expertId ? "Expert" : "User"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <p className="text-pink-600 hover:text-indigo-900 cursor-pointer">
                          View
                        </p>
                        <p className="text-indigo-600 hover:text-indigo-900 cursor-pointer">
                          Edit
                        </p>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <p
                          className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                          onClick={() => handleEditUser(index)}
                        >
                          Edit
                        </p>
                        <p
                          className="text-pink-600 hover:text-indigo-900 py-3 cursor-pointer"
                          onClick={() => handleViewUser(item.id)}
                        >
                          View
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {mode === "usercommunity" && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers?.map((item, index) => (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        key={`item-${index}`}
                      >
                        {item}
                      </th>
                    ))}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Manage</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.map((item, index) => {
                    const role = item.role || item.subscription?.role || 'MEMBER';
                    const updatedAt = item.updatedAt || item.subscription?.updatedAt || item.subscription?.endDate || item.subscription?.end_date || item.subscription?.expiresAt || item.expiresAt;
                    return (
                    <tr 
                      key={`Meeting-${index}`}
                      onContextMenu={onContextMenu ? (e) => onContextMenu(e, item) : undefined}
                      className={onContextMenu ? "cursor-pointer hover:bg-gray-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="text-sm font-medium text-gray-900">
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start justify-left ">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 text-left">
                              {item?.name || item?.unifiedUser?.user?.name || item?.unifiedUser?.expert?.name || item?.unifiedUser?.admin?.name || item?.unifiedUser?.partner?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item?.unifiedUser?.user?.email || item?.unifiedUser?.expert?.email || item?.unifiedUser?.admin?.email || item?.unifiedUser?.partner?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item?.unifiedUser?.user?.phone || item?.unifiedUser?.expert?.phone || item?.unifiedUser?.admin?.phone || item?.unifiedUser?.partner?.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(item?.startsAt).toDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(item?.expiresAt).toDateString()}
                        </div>
                      </td>
                      {/* Role column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role === 'ADMIN' ? 'bg-red-100 text-red-800' : role === 'MODERATOR' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{role.charAt(0) + role.slice(1).toLowerCase()}</span>
                      </td>
                      {/* Last Updated column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-500">{updatedAt ? new Date(updatedAt).toLocaleString() : '-'}</span>
                      </td>
                      {/* Manage button */}
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <button
                          className="px-3 py-1 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
                          onClick={onManage ? (e) => { e.stopPropagation(); onManage(item); } : (e) => { e.stopPropagation(); if (onContextMenu) onContextMenu(e, item); }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
            {mode === "sessionAnalytics" && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers?.map((item, index) => (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider "
                        key={`item-${index}`}
                      >
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.map((item, index) => (
                    <tr key={`Analytics-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        {item.index}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <div className="text-sm text-gray-900">
                          {getFormattedDate(
                            new Date(item?.startTime),
                            false,
                            true
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <div className="text-sm text-gray-900">
                          {getFormattedDate(
                            new Date(item?.endTime),
                            false,
                            true
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <div className="text-sm text-gray-900">
                          {item?.numPeople}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        {item?.numPeopleRSVP}
                      </td>
                    </tr>
                  ))}

                  {(!data || data.length === 0) && (
                    <p>No slots are over yet!</p>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table;
