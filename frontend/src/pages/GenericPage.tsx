import AwsNavbar from "@/components/AwsNavbar";
import AwsSidebar from "@/components/AwsSidebar";
import AwsBreadcrumb from "@/components/AwsBreadcrumb";

interface Props {
    title: string;
}

const GenericPage = ({ title }: Props) => {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <AwsNavbar />
            <div className="flex flex-1 overflow-hidden">
                <AwsSidebar />
                <main className="flex-1 overflow-y-auto w-full p-6">
                    <AwsBreadcrumb items={[{ label: "CloudStore S3", onClick: () => window.location.href = "/dashboard" }, { label: title }]} />

                    <div className="mt-4 mb-6">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        <p className="text-muted-foreground text-sm mt-1">This feature is currently under development.</p>
                    </div>

                    <div className="bg-card border border-border rounded-sm p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl opacity-50">🚧</span>
                        </div>
                        <h2 className="text-lg font-semibold mb-2">{title} coming soon</h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            We are working hard to bring you the {title.toLowerCase()} capabilities. Check back in a future update.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default GenericPage;
