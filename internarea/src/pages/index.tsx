import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronRight,
  MapPin,
  Heart,
  MessageCircle,
  Share2,
  Send,
  Image,
  Video,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { toast } from "react-toastify";
import { useLang } from "@/context/LangContext";

var API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function HomePage() {
  var { t } = useLang();
  var user = useSelector(selectuser);
  var categories = [
    "Big Brands",
    "Work From Home",
    "Part-time",
    "MBA",
    "Engineering",
    "Media",
    "Design",
    "Data Science",
  ];
  var slides = [
    { pattern: "pattern-1", title: "Start Your Career Journey", bgColor: "bg-indigo-600" },
    { pattern: "pattern-2", title: "Learn From The Best", bgColor: "bg-blue-600" },
    { pattern: "pattern-3", title: "Grow Your Skills", bgColor: "bg-purple-600" },
    { pattern: "pattern-4", title: "Connect With Top Companies", bgColor: "bg-teal-600" },
  ];
  var stats = [
    { number: "300K+", label: "companies hiring" },
    { number: "10K+", label: "new openings everyday" },
    { number: "21Mn+", label: "active students" },
    { number: "600K+", label: "learners" },
  ];

  var [internships, setinternship] = useState<any>([]);
  var [jobs, setjob] = useState<any>([]);
  var [selectedCategory, setSelectedCategory] = useState("");
  var [posts, setPosts] = useState<any[]>([]);
  var [newText, setNewText] = useState("");
  var [mediaUrl, setMediaUrl] = useState("");
  var [mediaType, setMediaType] = useState("");
  var [postLoading, setPostLoading] = useState(false);
  var [postLimitMsg, setPostLimitMsg] = useState("");
  var [commentText, setCommentText] = useState<any>({});
  var [showComments, setShowComments] = useState<any>({});
  var [friendList, setFriendList] = useState<string[]>([]);
  var [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    var fetchdata = async () => {
      try {
        var [internshipres, jobres, postres] = await Promise.all([
          axios.get(API + "/api/internship"),
          axios.get(API + "/api/job"),
          axios.get(API + "/api/community"),
        ]);
        setinternship(internshipres.data);
        setjob(jobres.data);
        setPosts(postres.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, []);

  useEffect(() => {
    if (user) {
      axios.get(API + "/api/auth/user/" + user.uid).then((res) => {
        setFriendList(res.data.friends || []);
      }).catch(() => {});
    }
    axios.get(API + "/api/community/users").then((res) => {
      setAllUsers(res.data);
    }).catch(() => {});
  }, [user]);

  var filteredInternships = internships.filter(
    (item: any) => !selectedCategory || item.category === selectedCategory
  );
  var filteredJobs = jobs.filter(
    (item: any) => !selectedCategory || item.category === selectedCategory
  );

  async function handlePost() {
    if (!user) { toast.error("Please login first"); return; }
    if (!newText && !mediaUrl) { toast.error("Write something or add media"); return; }
    setPostLimitMsg("");
    setPostLoading(true);
    try {
      var res = await axios.post(API + "/api/community", {
        authorUid: user.uid,
        authorName: user.name,
        authorPhoto: user.photo,
        text: newText,
        mediaUrl: mediaUrl,
        mediaType: mediaType || null,
      });
      setPosts([res.data, ...posts]);
      setNewText("");
      setMediaUrl("");
      setMediaType("");
      toast.success("Posted!");
    } catch (err: any) {
      var msg = err.response?.data?.message || "Failed to post";
      setPostLimitMsg(msg);
    }
    setPostLoading(false);
  }

  async function handleLike(postId: string) {
    if (!user) return;
    try {
      var res = await axios.post(API + "/api/community/" + postId + "/like", { uid: user.uid });
      setPosts(posts.map((p: any) => (p._id === postId ? res.data : p)));
    } catch (err) { console.log(err); }
  }

  async function handleComment(postId: string) {
    if (!user || !commentText[postId]) return;
    try {
      var res = await axios.post(API + "/api/community/" + postId + "/comment", {
        uid: user.uid, name: user.name, photo: user.photo, text: commentText[postId],
      });
      setPosts(posts.map((p: any) => (p._id === postId ? res.data : p)));
      setCommentText({ ...commentText, [postId]: "" });
    } catch (err) { console.log(err); }
  }

  async function handleShare(postId: string) {
    try {
      var res = await axios.post(API + "/api/community/" + postId + "/share");
      setPosts(posts.map((p: any) => (p._id === postId ? res.data : p)));
      toast.success("Shared!");
    } catch (err) { console.log(err); }
  }

  function handleMediaInput(type: string) {
    var url = prompt("Enter " + type + " URL:");
    if (url) { setMediaUrl(url); setMediaType(type); }
  }

  async function handleAddFriend(friendUid: string) {
    if (!user) { toast.error("Please login first"); return; }
    if (friendUid === user.uid) return;
    try {
      var res = await axios.post(API + "/api/community/add-friend", {
        uid: user.uid, friendUid: friendUid
      });
      setFriendList([...friendList, friendUid]);
      toast.success("Friend added! You now have " + res.data.friendCount + " friend(s)");
    } catch (err) {
      toast.error("Could not add friend");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("makeCareer")}</h1>
        <p className="text-xl text-gray-600">{t("trending")} 🔥</p>
      </div>

      <div className="mb-16">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30} slidesPerView={1} navigation
          pagination={{ clickable: true }} autoplay={{ delay: 5000 }}
          className="rounded-xl overflow-hidden shadow-lg"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className={`relative h-[400px] ${slide.bgColor}`}>
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {slide.pattern === "pattern-1" && (<pattern id="pattern-1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="3" fill="white" /></pattern>)}
                    {slide.pattern === "pattern-2" && (<pattern id="pattern-2" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><rect x="15" y="15" width="10" height="10" fill="white" /></pattern>)}
                    {slide.pattern === "pattern-3" && (<pattern id="pattern-3" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 L20 0 L40 20 L20 40 Z" fill="white" /></pattern>)}
                    {slide.pattern === "pattern-4" && (<pattern id="pattern-4" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M30 5 L55 30 L30 55 L5 30 Z" fill="white" /></pattern>)}
                    <rect x="0" y="0" width="100%" height="100%" fill={`url(#${slide.pattern})`} />
                  </svg>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h2 className="text-4xl font-bold text-white">{slide.title}</h2>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t("community")}</h2>
          {user && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
              <Users size={16} />
              <span>{friendList.length} {t("friends")}</span>
            </div>
          )}
        </div>
 
        {user && allUsers.filter((u: any) => u.uid && u.uid !== user.uid && !friendList.includes(u.uid)).length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("peopleYouMayKnow")}</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allUsers.filter((u: any) => u.uid && u.uid !== user.uid && !friendList.includes(u.uid)).slice(0, 8).map((u: any) => (
                <div key={u.uid} className="flex flex-col items-center min-w-[80px]">
                  <img src={u.photo || "/default-avatar.png"} alt="" className="w-12 h-12 rounded-full mb-1" />
                  <p className="text-xs text-gray-700 text-center truncate w-20">{u.name || "User"}</p>
                  <button onClick={() => handleAddFriend(u.uid)} className="mt-1 text-xs text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 hover:bg-blue-50">
                    {t("connect")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {user && (
          <div className="bg-white rounded-xl shadow-md p-5 mb-6">
            <div className="flex items-start gap-3">
              <img src={user.photo} alt="" className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder={t("postSomething")}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-blue-400 text-gray-800"
                  rows={3}
                />
                {mediaUrl && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500 flex justify-between items-center">
                    <span>{mediaType}: {mediaUrl.substring(0, 40)}...</span>
                    <button onClick={() => { setMediaUrl(""); setMediaType(""); }} className="text-red-500 font-bold">✕</button>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleMediaInput("image")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                      <Image size={16} /> {t("photo")}
                    </button>
                    <button onClick={() => handleMediaInput("video")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                      <Video size={16} /> {t("video")}
                    </button>
                  </div>
                  <button onClick={handlePost} disabled={postLoading} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {postLoading ? t("posting") : t("post")}
                  </button>
                </div>
                {postLimitMsg && (
                  <p className="text-red-500 text-xs mt-2">{postLimitMsg}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Post Feed */}
        <div className="space-y-4">
          {posts.map((post: any) => (
            <div key={post._id} className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-center gap-3 mb-3">
                <img src={post.authorPhoto || "/default-avatar.png"} alt="" className="w-9 h-9 rounded-full" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{post.authorName}</p>
                  <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
                {user && post.authorUid !== user.uid && !friendList.includes(post.authorUid) && (
                  <button onClick={() => handleAddFriend(post.authorUid)} className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-50">
                    <UserPlus size={12} /> Connect
                  </button>
                )}
                {user && friendList.includes(post.authorUid) && (
                  <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">Friends</span>
                )}
              </div>
              {post.text && <p className="text-gray-700 text-sm mb-3">{post.text}</p>}
              {post.mediaUrl && post.mediaType === "image" && (
                <img src={post.mediaUrl} alt="" className="w-full rounded-lg mb-3 max-h-96 object-cover" />
              )}
              {post.mediaUrl && post.mediaType === "video" && (
                <video src={post.mediaUrl} controls className="w-full rounded-lg mb-3 max-h-96" />
              )}
              <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                <button onClick={() => handleLike(post._id)} className={"flex items-center gap-1 text-sm " + (post.likes?.includes(user?.uid) ? "text-red-500" : "text-gray-500 hover:text-red-500")}>
                  <Heart size={16} fill={post.likes?.includes(user?.uid) ? "currentColor" : "none"} /> {post.likes?.length || 0}
                </button>
                <button onClick={() => setShowComments({ ...showComments, [post._id]: !showComments[post._id] })} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500">
                  <MessageCircle size={16} /> {post.comments?.length || 0}
                </button>
                <button onClick={() => handleShare(post._id)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-500">
                  <Share2 size={16} /> {post.shares || 0}
                </button>
              </div>
              {showComments[post._id] && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {post.comments?.map((c: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <img src={c.photo || "/default-avatar.png"} alt="" className="w-6 h-6 rounded-full mt-0.5" />
                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium text-gray-800">{c.name}</span>
                        <p className="text-gray-600">{c.text}</p>
                      </div>
                    </div>
                  ))}
                  {user && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        value={commentText[post._id] || ""}
                        onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                        placeholder={t("writeComment")}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none text-gray-800"
                        onKeyDown={(e) => { if (e.key === "Enter") handleComment(post._id); }}
                      />
                      <button onClick={() => handleComment(post._id)} className="text-blue-600 hover:text-blue-700">
                        <Send size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("latestInternships")}</h2>
        <div className="flex flex-wrap gap-4">
          <span className="text-gray-700 font-medium uppercase tracking-wider">{t("popularCategories")}</span>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? "" : category)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Internship grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {filteredInternships.map((internship: any, index: any) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 transition-transform hover:transform hover:scale-105">
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <ArrowUpRight size={20} />
              <span className="font-medium">{t("activelyHiring")}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">{internship.title}</h3>
            <p className="text-gray-500 mb-4">{internship.company}</p>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-center gap-2"><MapPin size={18} /><span>{internship.location}</span></div>
              <div className="flex items-center gap-2"><Banknote size={18} /><span>{internship.stipend}</span></div>
              <div className="flex items-center gap-2"><Calendar size={18} /><span>{internship.duration}</span></div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{t("internshipLabel")}</span>
              <Link href={`/detailiternship/${internship._id}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                {t("viewDetails")} <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("latestJobs")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredJobs.map((job: any, index: any) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 transition-transform hover:transform hover:scale-105">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <ArrowUpRight size={20} />
                <span className="font-medium">{t("activelyHiring")}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{job.title}</h3>
              <p className="text-gray-500 mb-4">{job.company}</p>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-center gap-2"><MapPin size={18} /><span>{job.location}</span></div>
                <div className="flex items-center gap-2"><Banknote size={18} /><span>{job.CTC}</span></div>
                <div className="flex items-center gap-2"><Calendar size={18} /><span>{job.Experience}</span></div>
              </div>
              <div className="flex items-center justify-between mt-6">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{t("jobsLabel")}</span>
                <Link href={`/detailjob/${job._id}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  {t("viewDetails")} <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
