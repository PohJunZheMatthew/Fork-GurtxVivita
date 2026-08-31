import { motion } from "framer-motion";
import {Material} from "../../types.ts";
import {IoArrowBack, IoLocationSharp} from "react-icons/io5";
import React from "react";
import {HiMiniCubeTransparent} from "react-icons/hi2";
import {Tooltip} from "react-tooltip";
import {MdCategory, MdDescription, MdOutlineInbox, MdOutlineNumbers, MdOutlineWarehouse} from "react-icons/md";
import {IoMdInformationCircleOutline} from "react-icons/io";

interface MaterialViewProps{
    material:Material;
    onSubmitRequest:(materialId: string, quantity: number, reason: string) => Promise<void> | void;
    setCurrentMaterial:any;
}
function rendernil(){
    return (<>
        <div
            data-tooltip-id="desc-my-tooltip"
            data-tooltip-content="Hmmmm...."
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
        >
            nil
            <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: "linear", duration: 5 }}
                style={{ display: "inline-block" }}
            >
                🤔
            </motion.span>
        </div>

        <Tooltip
            id="desc-my-tooltip"
            place="right"
            className={"border"}
            noArrow={true}
            style={{
                backgroundColor: "white",
                color: "#1f2937",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                opacity: 1
            }}
        />
    </>)
}
export function MaterialView({
    material,
    onSubmitRequest,
                                 setCurrentMaterial,
                             }:MaterialViewProps){
    return (<div className={"w-full h-full p-2.5 bg-white bg-[repeating-linear-gradient(45deg,#000_0,#000_2px,transparent_0,transparent_50%)] bg-size-[50px_50px]"}>
        <button
            onClick={() => { setCurrentMaterial(null); }}
            className="left-0 flex flex-row items-center gap-2 bg-white rounded-lg shadow-lg p-1">
            <IoArrowBack />
            <motion.span>Go back</motion.span>
        </button>
        <div className={"grid grid-cols-2 p-2 gap-4"}>
            <div className={"shadow-lg w-full rounded-lg border-2 bg-white"}>
                <HiMiniCubeTransparent className="w-full h-full text-gray-600" />
            </div>
            <div className={"text-left p-2.5 shadow-lg rounded-lg border-2 bg-white"}>

                <motion.p
                    className="relative inline-block text-left text-3xl pb-1"
                    initial="initial"
                    whileHover="hovered"
                >
                    {material.name}
                    <motion.div
                        className="absolute bottom-2 left-0 h-[2px] bg-black"
                        variants={{
                            initial: {
                                width: "0%"
                            },
                            hovered: {
                                width: "100%",
                                transition: { duration: 0.1, ease: "easeInOut" }
                            }
                        }}
                    />
                </motion.p>
                <p className={"text-xs"}>#id:{material.id}</p>
                <div className={"text-sm"} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MdDescription />
                        <span>Description: </span>
                        {material.description.length > 0 ? (
                            <span>{material.description}</span>
                        ) : (
                            rendernil()
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MdCategory />
                        <span>Category: {material.category}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MdOutlineNumbers />
                        <span>Quantity: {material.quantity} {material.unit}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IoLocationSharp />
                        <span>Location: {material.location}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MdOutlineInbox />
                        <span>Storage: {material.storage}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IoMdInformationCircleOutline />
                        <span>Stock status: {material.stockStatus}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MdOutlineWarehouse />
                        <span>
                            Supplier: {material.supplier !== null && material.supplier !== undefined ? (
                                <span>{material.supplier}</span>
                            ) : (
                                rendernil()
                            )}</span>

                    </div>
                </div>
                <div className={"gap-4"}>
                    <motion.button
                        whileHover={{
                            backgroundImage:
                                "repeating-linear-gradient(45deg, #000000ff, #000000ff 1px, transparent 1px, transparent 22.63px)",
                            backgroundSize: "32px 32px",
                        }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            backgroundColor: "#ffffff",
                            backgroundImage: "none",
                            backgroundSize: "32px 32px",
                            color: "#000000",
                            padding: "12px 24px",
                            border: "2px solid #000000",
                            borderRadius: "12px",
                            fontSize: "18px",
                            fontWeight: "500",
                            cursor: "pointer",
                        }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut",
                        }}
                    >
                        request
                    </motion.button>

                    <motion.button
                        whileHover={{
                            backgroundImage:
                                "repeating-linear-gradient(45deg, #000000ff, #000000ff 1px, transparent 1px, transparent 22.63px)",
                            backgroundSize: "32px 32px",
                        }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            backgroundColor: "#ffffff",
                            backgroundImage: "none",
                            backgroundSize: "32px 32px",
                            color: "#000000",
                            padding: "12px 24px",
                            border: "2px solid #000000",
                            borderRadius: "12px",
                            fontSize: "18px",
                            fontWeight: "500",
                            cursor: "pointer",
                        }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut",
                        }}
                    >
                        add to group
                    </motion.button>
                </div>
            </div>
        </div>
    </div>)
}