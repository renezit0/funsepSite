              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={() => {
                    window.location.href = '/admin';
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
