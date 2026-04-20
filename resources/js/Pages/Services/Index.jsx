import React from "react";
import { Head, Link } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

export default function ServicesIndex({ services = [] }) {
    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto px-4 py-10">
                <Head title="Leistungen" />

                <h1 className="text-3xl font-extrabold mb-6">Leistungen</h1>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => {
                        const excerpt =
                            service.shortDescription ||
                            service.description ||
                            "";

                        const href = service.slug
                            ? route("static.show", service.slug)
                            : "#";

                        return (
                            <article
                                key={service.slug ?? service.id}
                                className="rounded-xl border p-4"
                            >
                                {service.image && (
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="rounded-lg mb-3"
                                        loading="lazy"
                                        decoding="async"
                                        fetchpriority="low"
                                    />
                                )}

                                <h2 className="font-bold text-lg mb-1">
                                    {service.title}
                                </h2>

                                {excerpt && (
                                    <div className="text-slate-600 text-sm mb-3">
                                        {excerpt}
                                    </div>
                                )}

                                {service.slug && (
                                    <Link
                                        href={href}
                                        className="text-blue-600 text-sm font-medium hover:underline"
                                    >
                                        Details ansehen →
                                    </Link>
                                )}
                            </article>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
