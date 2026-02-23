"use client";
import React from 'react';

const Sidebar = ({ activeTab, onTabChange }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-logo" onClick={() => onTabChange('dashboard')} style={{ cursor: 'pointer' }}>
                <svg width="32" height="32" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_sidebar_magie)">
                        <path d="M89.5805 119.998H59.496V150.083H89.5805V119.998Z" fill="#875FDC" />
                        <g opacity="0.4">
                            <path d="M119.665 150.083H89.5805V180.164H119.665V150.083Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.72">
                            <path d="M89.5805 89.9135H59.496V119.998H89.5805V89.9135Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.72">
                            <path d="M119.665 119.998H89.5805V150.083H119.665V119.998Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.72">
                            <path d="M59.496 119.998H29.4114V150.083H59.496V119.998Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.72">
                            <path d="M89.5805 150.083H59.496V180.164H89.5805V150.083Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M59.496 150.083H29.4114V180.164H59.496V150.083Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M59.496 89.9135H29.4114V119.998H59.496V89.9135Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M119.665 89.9135H89.5805V119.998H119.665V89.9135Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M89.5805 59.8287H59.496V89.9133H89.5805V59.8287Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M89.5805 180.164H59.496V210.249H89.5805V180.164Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M209.915 180.164H179.831V210.249H209.915V180.164Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M179.831 59.8287H149.75V89.9133H179.831V59.8287Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M240 59.8287H209.915V89.9133H240V59.8287Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M149.75 119.998H119.665V150.083H149.75V119.998Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M29.4114 119.998H-0.669998V150.083H29.4114V119.998Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M209.915 89.9135H179.831V119.998H209.915V89.9135Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.4">
                            <path d="M209.915 29.7478H179.831V59.8292H209.915V29.7478Z" fill="#875FDC" />
                        </g>
                        <g opacity="0.72">
                            <path d="M209.915 59.9346H179.831V90.016H209.915V59.9346Z" fill="#875FDC" />
                        </g>
                    </g>
                    <defs>
                        <clipPath id="clip0_sidebar_magie">
                            <rect width="240" height="240" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
            </div>

            <div className="sidebar-menu">
                <button
                    className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => onTabChange('dashboard')}
                    title="Dashboard"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="24" height="24">
                        <path opacity=".4" d="M96.5 384L96.5 544L160.5 544L160.5 384L96.5 384zM224.5 288L224.5 544L288.5 544L288.5 288L224.5 288zM352.5 352L352.5 544L416.5 544L416.5 352L352.5 352zM480.5 288L480.5 544L544.5 544L544.5 288L480.5 288z" /><path d="M589.5 133L564.5 153L404.5 281L385.1 296.5L365.3 281.6L257.1 200.5L116.5 313L91.5 333L51.5 283L76.5 263L236.5 135L255.9 119.5L275.7 134.4L383.9 215.5L524.5 103L549.5 83L589.5 133z" />
                    </svg>
                </button>

                <button
                    className={`sidebar-btn ${activeTab === 'invoice' ? 'active' : ''}`}
                    onClick={() => onTabChange('invoice')}
                    title="Vystavit fakturu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="24" height="24">
                        <path opacity=".4" d="M128 64L128 576L512 576L512 208L368 64L128 64zM192 128L288 128L288 176L192 176L192 128zM192 224L288 224L288 272L192 272L192 224zM192 352L448 352L448 480L192 480L192 352zM336 122.5L453.5 240L336 240L336 122.5z" />
                        <path d="M216 128L192 128L192 176L288 176L288 128L216 128zM216 224L192 224L192 272L288 272L288 224L216 224zM192 352L192 480L448 480L448 352L192 352z" />
                    </svg>
                </button>

                <button
                    className={`sidebar-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => onTabChange('calendar')}
                    title="Vystavit kalendář"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="24" height="24">
                        <path opacity=".4" d="M96 224L544 224L544 544L96 544L96 224zM160 288L160 352L224 352L224 288L160 288zM160 416L160 480L224 480L224 416L160 416zM288 288L288 352L352 352L352 288L288 288zM288 416L288 480L352 480L352 416L288 416zM416 288L416 352L480 352L480 288L416 288zM416 416L416 480L480 480L480 416L416 416z" />
                        <path d="M256 96L256 64L192 64L192 128L96 128L96 224L544 224L544 128L448 128L448 64L384 64L384 128L256 128L256 96z" />
                    </svg>
                </button>

                <button
                    className={`sidebar-btn ${activeTab === 'customers' ? 'active' : ''}`}
                    onClick={() => onTabChange('customers')}
                    title="Adresář odběratelů"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="24" height="24">
                        <path opacity=".4" d="M0 544L110.7 544L113.2 533.2L155 352L48 352L0 544zM24 224C24 263.8 56.2 296 96 296C135.8 296 168 263.8 168 224C168 184.2 135.8 152 96 152C56.2 152 24 184.2 24 224zM472 224C472 263.8 504.2 296 544 296C583.8 296 616 263.8 616 224C616 184.2 583.8 152 544 152C504.2 152 472 184.2 472 224zM485 352L526.8 533.2L529.3 544L640 544L592 352L485 352z" /><path d="M320 288C377.4 288 424 241.4 424 184C424 126.6 377.4 80 320 80C262.6 80 216 126.6 216 184C216 241.4 262.6 288 320 288zM480 544L432 336L208 336L160 544L480 544z" />
                    </svg>
                </button>


                <button
                    className={`sidebar-btn ${activeTab === 'cashflow' ? 'active' : ''}`}
                    onClick={() => onTabChange('cashflow')}
                    title="Příjmy/Výdaje"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="24" height="24">
                        <path opacity=".4" d="M64.4 269.8L69.5 274.9L120.4 325.8L222.2 224L174.2 176C198.7 176 218.1 176 232.4 176L232.4 128L576.4 128L576.4 370.2L571.3 365.1L520.4 314.2L418.6 416L466.6 464L408.4 464L408.4 512C513.7 512 414.4 512 64.4 512L64.4 269.8zM128.4 384L128.4 448L192.4 448C192.4 412.7 163.7 384 128.4 384zM224.4 320C223.3 354.9 241.2 387.6 271.3 405.4C301.3 423.1 338.6 423.1 368.6 405.4C398.7 387.6 416.6 354.9 415.5 320C416.6 285.1 398.7 252.4 368.6 234.6C338.6 216.9 301.3 216.9 271.3 234.6C241.2 252.4 223.3 285.1 224.4 320zM448.4 192C448.4 227.3 477.1 256 512.4 256L512.4 192L448.4 192z" /><path d="M31.5 135C88.7 77.8 118.3 48.2 120.5 46L154.4 80C145.4 89 129.4 105 106.4 128C187.4 128 229.5 128 232.5 128L232.5 176C229.5 176 187.5 176 106.4 176C129.4 199 145.4 215 154.4 224L120.5 257.9C118.4 255.8 88.7 226.1 31.5 168.9L14.5 151.9L31.5 134.9zM609.4 471L626.4 488C624.3 490.1 594.6 519.8 537.4 577L520.4 594L486.5 560.1C495.5 551.1 511.5 535.1 534.5 512.1L408.4 512.1L408.4 464.1L534.5 464.1L486.5 416.1L520.4 382.2C522.5 384.3 552.2 414 609.4 471.2z" />
                    </svg>
                </button>

                <button
                    className={`sidebar-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => onTabChange('history')}
                    title="Vystavené doklady"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="24" height="24">
                        <path opacity=".4" d="M96 192L96 544L544 544L544 192L96 192zM224 304L416 304L416 352L224 352L224 304z" />
                        <path d="M64 96L576 96L576 192L64 192z" />
                    </svg>
                </button>

                <div className="sidebar-bottom-menu" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => onTabChange('profile')}
                        title="Profil"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="24" height="24">
                            <path opacity=".4" d="M200 192C200 258.3 253.7 312 320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192z" /><path d="M176 368L464 368L528 576L112 576L176 368z" />
                        </svg>
                    </button>

                    <button
                        className={`sidebar-btn sidebar-settings-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => onTabChange('settings')}
                        title="Nastavení"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="24" height="24">
                            <path opacity=".4" d="M272.1 320C272.1 346.5 293.6 368 320.1 368C346.5 368 368 346.5 368 320C368 293.5 346.5 272.1 320.1 272.1C293.6 272.1 272.1 293.5 272.1 320z" />
                            <path d="M264.1 48L376.1 48L395.8 143.5C409.9 149.5 423.1 157.2 435.1 166.3L527.7 135.6L583.7 232.6L510.8 297.4C511.7 304.8 512.1 312.4 512.1 320.1C512.1 327.8 511.6 335.4 510.8 342.8L583.7 407.6L527.7 504.6L435.1 473.9C423 483 409.8 490.6 395.8 496.7L376.1 592.2L264.1 592.2L244.4 496.7C230.3 490.7 217.2 483 205.1 473.9L112.5 504.6L56.5 407.6L129.4 342.8C128.5 335.4 128.1 327.8 128.1 320.1C128.1 312.4 128.6 304.8 129.4 297.4L56.5 232.6L112.5 135.6L205.1 166.3C217.2 157.2 230.4 149.6 244.4 143.5L264.1 48zM320.1 416C373.1 416 416.1 373 416.1 320C416 266.9 373 224 320 224C267 224 224 267 224.1 320.1C224.1 373.1 267.1 416 320.1 416z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

