import React, { useState, useEffect } from "react";
import "../../styles/community/allCom.css";
import {
  AiOutlineSearch,
  AiOutlineArrowLeft as Lefticon,
  AiOutlineArrowRight as Righticon,
} from "react-icons/ai";
import {
  HiSortAscending as Ascending,
  HiSortDescending as Descending,
} from "react-icons/hi";
import { BsFillPlusCircleFill as Plus } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import CommunityCardHolder from "../homepage/CommunityCardHolder";
import PortalPopup from "../PortalPopup";
import CreateCommunity from "./CreateCommunity";
import { toast } from "react-toastify";
import LoadingIcon from "../utility/Loader/LoadingIcon";
import { ScaleLoader, SyncLoader } from "react-spinners";

function AllCommunity() {
  const [communities, setCommunities] = useState([]);
  const [createCom, setcreateCom] = useState(false);
  const [sortOption, setSortOption] = useState("rating");
  const [sortOrder, setSortOrder] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const toggleCreateCom = () => {
    const status = window.localStorage.getItem("logInStatus");
    if (status === "false" && !createCom) {
      toast.error("Please login to create a community");
      return;
    }

    setcreateCom(!createCom);
  };

  const fetch_coms = async (criteria, order) => {
    let URL = import.meta.env.VITE_CURRENT_PATH+`/get_all_communities/${criteria}/${order}/${currentPage}`;
    if (searchQuery.length > 0) URL += `?tag=${searchQuery}`;

    setLoading(true);
    const response = await axios.get(URL);
    const data = response.data;
    const noOfComs = data.total;
    const noOfPages = Math.ceil(noOfComs / 8.0);
    setPages(noOfPages);
    setLoading(false);
    setCommunities(data.communities);
  };

  useEffect(() => {
    fetch_coms(sortOption, sortOrder);
  }, [sortOption, sortOrder, currentPage]);

  return (
    <motion.div layout className="community-container">
      <div className="community-header">Our Communities</div>

      <div className="search-bar">
        <div className="search-input">
          <div className="search-icon">
            <AiOutlineSearch />
          </div>
          <input
            type="search"
            className="search-input-holder"
            placeholder="Search communities by tag"
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
          />
          <motion.button
            whileHover={{ scale: 1.04, backgroundColor: "#ee4962" }}
            whileTap={{ scale: 0.9 }}
            className="search-community-button"
            onClick={() => {
              fetch_coms(sortOption, sortOrder);
            }}
          >
            Search
          </motion.button>
        </div>

        <div className="sort-by">
          <div className="sort-by-text">Sort by</div>
          <select
            name="sort"
            id="sort"
            className="sort-dropdown"
            onChange={(e) => {
              setSortOption(e.target.value);
            }}
          >
            <option value="rating" className="sort-dropdown-item">
              Rating
            </option>
            <option value="members" className="sort-dropdown-item">
              Member Count
            </option>
            <option value="resource" className="sort-dropdown-item">
              Available Resources
            </option>
            <option value="name" className="sort-dropdown-item">
              Name
            </option>
          </select>
        </div>

        <div className="show-as">
          <div
            className="show-as-block"
            onClick={() => {
              setSortOrder(1);
            }}
          >
            <Ascending />
          </div>
          <div
            className="show-as-block"
            onClick={() => {
              setSortOrder(-1);
            }}
          >
            <Descending />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.04, backgroundColor: "#ee4962" }}
          whileTap={{ scale: 0.9 }}
          className="add-community"
          onClick={toggleCreateCom}
        >
          <Plus />
          Create a Community
        </motion.button>
      </div>

      <motion.div
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        layout
        className="cards-holder"
      >
        {loading ? (
          <PortalPopup overlayColor="rgba(0,0,0, 0.5)" placement="Centered">
            <ScaleLoader color="#36d7b7" height={35} width={5} />
          </PortalPopup>
        ) : communities.length !== 0 ? (
          <AnimatePresence mode="wait">
            {communities.map((com, index) => (
              <CommunityCardHolder
                key={index}
                communityTag={com.tag}
                communityBio={com.description}
                communityRating={com.rating}
                communityName={com.name}
                resourceCount={com.resource}
                memberCount={com.members}
                communityImage={`${com.com_image}`}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div
            style={{
              fontWeight: "600",
              fontFamily: "Poppins",
              position: "absolute",
              left: "40%",
            }}
          >
            No communities found
          </div>
        )}
      </motion.div>

      <div className="select-page">
        {currentPage > 0 && (
          <motion.button
            whileHover={{
              scale: 1.04,
              backgroundColor: "#ee4962",
              color: "#ffffff",
              border: "none",
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setCurrentPage(currentPage - 1);
              setTimeout(() => {
                window.scrollTo(0, 0);
              }, 300);
            }}
            className="prev-button"
          >
            <Lefticon /> Previous
          </motion.button>
        )}

        {Array(pages)
          .fill(null)
          .map((elem, index) => (
            <motion.button
              whileHover={{
                scale: 1.04,
                backgroundColor: "#ee4962",
                color: "#ffffff",
                border: "none",
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setCurrentPage(index);
                setTimeout(() => {
                  window.scrollTo(0, 0);
                }, 300);
              }}
              className="page-button"
              key={index}
              style={{
                backgroundColor:
                  currentPage === index ? "#ee4962" : "transparent",
                color: currentPage === index ? "#ffffff" : "#000000",
              }}
            >
              {index + 1}
            </motion.button>
          ))}

        {currentPage < pages - 1 && (
          <motion.button
            whileHover={{
              scale: 1.04,
              backgroundColor: "#ee4962",
              color: "#ffffff",
              border: "none",
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setCurrentPage(currentPage + 1);
              setTimeout(() => {
                window.scrollTo(0, 0);
              }, 300);
            }}
            className="prev-button"
          >
            Next <Righticon />
          </motion.button>
        )}
      </div>

      <AnimatePresence initial={false} mode="wait" onExitComplete={() => null}>
        {createCom && (
          <PortalPopup
            overlayColor="rgba(0,0,0, 0.5)"
            placement="Centered"
            onOutsideClick={toggleCreateCom}
          >
            <CreateCommunity closePopUp={toggleCreateCom} />
          </PortalPopup>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AllCommunity;
